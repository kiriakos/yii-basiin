<?php

/**
 * Controller for basiin file IO
 *
 * Usage: host.domain/basiin/route/...
 * Usage: host.domain/basiin/tell/...
 * 
 */
class FileController extends Controller
{
        public $defaultAction = 'file';
        public $layout='//layouts/selfRemove';
        

        /**
         * Proxy to published assets
         *
         * Asks the framework where to find a script file.
         *
         * If the file is found (seraches js directory) it gets published and
         * the browser <script> request is redirected to the published file
         * 
         * @param string $trid  BTransaction->id
         * @param string $file  A file in views/file
         * 
         */
        public function actionRoute($trid, $file = 'jquery-1.7.1.min.js'){
            
            Basiin::renderFile ($file, $this, array(
                    'transaction' => Basiin::getTransaction($trid)
                    ));
            
            
            //DEPRECATED, bassiin render file if exists, else return a null
            //object.
            //if the scripte file exists in js
            //if(file_exists($rFile))
            //    //publish the script file and redirect there
            //    $this->redirect($scriptUrl =Yii::app()->getBaseUrl(True) .
            //        Yii::app()->getAssetManager()->publish($rFile));
            //else
            //    //else return an explanatory script
            //    $this->renderPartial('notFound');
            
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