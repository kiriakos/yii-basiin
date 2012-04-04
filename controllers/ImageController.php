<?php

/**
 * Controller for the basiin initialization step
 *
 * Usage: host.domain/basiin/init/"nextAction"
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
         *
         * @param string $nextAction
         */
        public function actionUploaded($transactionId,$transferId = null, $data1=null, $data2=null)
	{
            $transactionId = (integer) $transactionId;
            $transferId = (integer) $transferId;
            $dlOnly = ((int) $data1===1)?true:false;
            
            //get transaction & transfer
            $transaction = Basiin::getTransaction($transactionId);
            $transfer = $transaction->getTransfer($transferId);

            //if all correct get file
            if (!$transaction || !$transfer)
                throw  new CHttpException (400, "sorry, either transaction or transfer don't exist anymore", 007);
            else
                $file = file_get_contents ($transfer->getFilePath());

            $coma = strpos($file,',');         
            $meta = substr($file, 0, $coma);
            $data = substr($file, $coma+1);

            $meta = explode(';', $meta);
            $meta[0] = (explode(':', $meta[0]));
            $meta[0] = $meta[0][count($meta[0])-1];
            $fileMime = $meta[0]; //eg: "image/png"
            $fileType = explode('/', $fileMime);
            $fileType = $fileType[count($fileType)-1];
            if(count($meta) == 3) {
                $charSet = explode('=', $meta[1]);
                if(count($charSet) == 2) $charSet = $charSet[1];
            }else
                $charSet = 'utf-8';
            
            $b64enc = ( strtolower($meta[count($meta)-1]) == 'base64');

            //manage js.toDataURL() data
            if($b64enc)
                $data = base64_decode($data);
            
            //create image object
            $im = imagecreatefromstring($data);

//            die(var_dump((($data2)?$data2:$transfer->file_name)));
            if($dlOnly)
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
            else
            {
                //if upload:
                // create Image & write image object to /images/originals
                // redirect to Image/view view

            }

            //end
	}

	// Uncomment the following methods and override them if needed
	/*
	public function filters()
	{
		// return the filter configuration for this controller, e.g.:
		return array(
			'inlineFilterName',
			array(
				'class'=>'path.to.FilterClass',
				'propertyName'=>'propertyValue',
			),
		);
	}

	public function actions()
	{
		// return external action classes, e.g.:
		return array(
			'action1'=>'path.to.ActionClass',
			'action2'=>array(
				'class'=>'path.to.AnotherActionClass',
				'propertyName'=>'propertyValue',
			),
		);
	}
	*/
}