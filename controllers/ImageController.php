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

//        /**
//	 * @return array action filters
//	 */
//	public function filters()
//	{
//		return array(
//			'accessControl', // perform access control for CRUD operations
//		);
//	}
//
//        public function accessRules()
//	{
//            return array(
//                array('allow', // allow admin user to perform 'admin' and 'delete' actions
//                        'users'=>array('kappa@kindstudios.gr'),
//                ),
//                array('allow',  // allow all users to perform 'index' and 'view' actions
//                        'actions'=>array('uploaded'),
//                        'users'=>array('@'),
//                )
//            );
//	}
        
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
            //die(var_dump(rawurldecode($data1)));
            $data = json_decode(rawurldecode($data1));
            
            //get transaction & transfer
            $transaction = Basiin::getTransaction($transactionId);
            $transfer = $transaction->getTransfer($transferId);
            
            //if all correct get file
            if (!$transaction || !$transfer)
                throw  new CHttpException (400, "sorry, either transaction or transfer don't exist anymore", 007);
            else
                $file = file_get_contents ($transfer->getFilePath());

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

            if($data->dlOnly)
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
                $image->title = $data->title;
                //CAUTION canvas submitted data is always png data
                $mas=array();
                preg_match("/(^.*\.)([\w]+$)/",$data->filename, $mas);
                var_dump($mas[1]);
                $mimeSplode = explode('/', $fileMime);
                $image->filename = $mas[1].'.'. $mimeSplode[1];
                $image->tags = $data->tags;
                $image->GDImageData = $im;

                

                // create Image & write image object to /images/originals
                $saved = $image->saveUploadedImage($fileMime);
                //die(var_dump($image->validate()));

                if ($saved && $image->save()){
                    $transfer->delete();
                    // redirect to Image/view view
                    $this->redirect('/image/update/'.$image->id);
                    Yii::app()->user->setFlash('success', "Image added, return to <a href=\"$data->flashRewindUrl\">$data->flashRewindTitle</a>");
                }
                else
                    throw new CHttpException ( 500, "Image save failed", 007);
            }

            
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