<?php

/**
 * Controller for the basiin initialization step
 *
 * Usage: <host.domain>/basiin/image/<action>/<d1>?/<d2>?
 * 
 */
class ImageController extends Controller
{
        public $defaultAction = 'image';
        public $layout='//layouts/selfRemove';
        
        /**
         * A request to initialize a Basiin transaction
         *
         * This is the first request every BMlet has to make since this
         * 1) initializes the transaction (on BMlet press = 1 transaction)
         * 2) randomizes the function values and stores the aliases in the
         *    session
         *
         * @param string $nextAction
         */
        public function actionUploaded($transactionId, $transferId , $data1=null, $data2=null)
	{
            $transactionId = (integer) $transactionId;
            $transferId = (integer) $transferId;
            $metaTransferId = (int) $data1;

            $transaction = Basiin::getTransaction($transactionId);
            $transfer = $transaction->getTransfer($transferId);

            if($metaTransferId)
                $metadata = json_decode( Basiin::getTransferData($metaTransferId, false) );
            else
                $metadata = false;

            //die(var_dump($metadata));
            
            //if all correct get file
            if (!$transaction || !$transfer)
                throw  new CHttpException (400, "sorry, either transaction or transfer don't exist anymore", 007);
            else
                $file = $transfer->getFileData ();

            
            $imcoma = strpos($file,',');
            $immeta = substr($file, 0, $imcoma);
            $imdata = substr($file, $imcoma+1);

            $immeta = explode(';', $immeta);
            $immeta[0] = (explode(':', $immeta[0]));
            $immeta[0] = $immeta[0][count($immeta[0])-1];
            $fileMime = $immeta[0]; //eg: "image/png"
            $fileType = explode('/', $fileMime);
            $fileType = $fileType[count($fileType)-1];
            if(count($immeta) == 3) {
                $charSet = explode('=', $immeta[1]);
                if(count($charSet) == 2) $charSet = $charSet[1];
            }else
                $charSet = 'utf-8';
            
            $b64enc = ( strtolower($immeta[count($immeta)-1]) == 'base64');

            //manage js.toDataURL() data
            if($b64enc)
                $imdata = base64_decode($imdata);
            
            //create image object
            $im = imagecreatefromstring($imdata);

            if($metadata && isset($metadata->dlOnly) && $metadata->dlOnly)
            {
                if ($im !== false) {
                    header('Content-Description: File Transfer');
                    //header('Content-Type: '.$fileMime); //better use octet stream to force the dl dialogue
                    header('Content-Type: application/octet-stream');
                    header('Content-Disposition: attachment; filename='. (($data2)?$data2:$transfer->file_name.'.'.$fileType) );
                    header('Content-Transfer-Encoding: binary');
                    header('Expires: 0');
                    header('Cache-Control: must-revalidate');
                    header('Pragma: public');
                    //TODO find a way to calculate this header('Content-Length: ' . filesize($file));
                    ob_clean();
                    flush();


                    if($fileMime == 'image/png')
                        imagepng($im);
                    elseif($fileMime == 'image/jpg' || $fileMime == 'image/jpeg')
                        imagejpeg ($im);
                    elseif($fileMime == 'image/gif')
                        imagegif ($im);
                    else
                        throw  new CHttpException (500, "GD Unexpected mime type", 007);

                    imagedestroy($im);
                }else
                    throw  new CHttpException (500, "GD image creation from string failed", 007);
            }
            else // this code is specific to kindstudios.gr, you have to complete it for your own projects //
            {
                //if upload:
                $image = new Image("basiinCreate");
                $image->title = $metadata->title;
                //CAUTION canvas submitted data is always png data
                $mas=array();
                preg_match("/^(?:[^\?]*\/)?([^\?]+)/",$metadata->filename, $mas);
                
                $mimeSplode = explode('/', $fileMime);
                $image->filename = $mas[1].'.'. $mimeSplode[1];
                $image->GDImageData = $im;
                if ($metadata){
                    if (isset($metadata->flashRewindUrl)&&$metadata->description)
                        $metadata->description.='\n\nsource: '.$metadata->flashRewindUrl;
                    else if(isset($metadata->flashRewindUrl))
                        $metadata->description ='source: '.$metadata->flashRewindUrl;
                    
                    if( isset($metadata->description) )
                        $image->addDescription ($metadata->description);

                    if( isset($metadata->flashRewindUrl) && isset($metadata->flashRewindTitle) )
                        Yii::app()->user->setFlash('success',
                        "Image added, return to <a href=\"$metadata->flashRewindUrl\">$metadata->flashRewindTitle</a>",
                                6);
                    
                    
                    if( isset($metadata->tags))$image->tags = $metadata->tags;

                }

                // create Image & write image object to /images/originals
                $saved = $image->saveUploadedImage($fileMime);
                //die(var_dump($image->validate()));

                if ($saved && $image->save()){
                    $transfer->delete();
                    $this->redirect('/image/update/'.$image->id);
                }
                else
                    throw new CHttpException ( 500, "Image save failed, sorry.", 007);
            }

            
	}


}