<?php

/**
 * Controller for the basiin initialization step
 *
 * Usage: host.domain/basiin/init/"nextAction"
 * 
 */
class InitController extends Controller
{
        public $defaultAction = 'init';
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
        public function actionInit($id = 'controllers', $random = null)
	{
            //set transaction ID
            $transaction = Basiin::newTransaction();
            $trs = array();
            foreach (Basiin::getTransactions() as $tr)
                $trs[] = $tr->id;
            $rendered = Basiin::renderFile('init', $this, array(
                'transaction'=>$transaction,
                'transactions'=>$trs,
                'jsFiles'=>array(
                    array(
                        'tag'=>'jQuery',
                        'file'=>'jquery-1.7.1.min.js',
                        'onLoad'=>"js:function(){".$transaction->id.".jQuery = jQuery.noConflict(true);}",
                )),
                'command'=>'image',
                'debug'=>true,
                'homeDomain'=>Yii::app()->request->hostInfo,
                'basiinPath'=>'basiin',
                'filePath'=>'scripts',
            ));

            if(!$rendered)
                throw new CHttpException (500, "sorry, counldn't complete request", 007);
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