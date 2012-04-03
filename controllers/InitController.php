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
        public function actionInit($action = 'controllers', $random = null)
	{
            //set transaction ID
            $transaction = Basiin::newTransaction();
            //$iss = (isset($transaction->_e['onafterconstruct']));
            //save the transaction after all it's changes are done.
            $transaction->save();

            //die(var_dump($transaction->id));
            
            //put the id's of other active transactions in session into an array
            $trs = array();
            foreach (Basiin::getTransactions() as $tr)
                $trs[] = $tr->id;

            //render the init file
            $rendered = Basiin::renderFile('init', $this, array(
                'transaction'=>$transaction,
                'transactions'=>$trs,
                'transfers'=> array(
                    'maxTransferSize' => Basiin::MaxTransferSize,
                ),
                'initFiles'=>array(
                    /**
                     * Example of installing jQuery on init
                     array(

                        'packageName'=>'jQueryProxy',
                        'fileName'=>'jQuery-proxy.js',
                        //'onAfterInstall'=>"js:function(event){event.basiin.x( 'jQueryPR2', basiin.jQueryProxy.noConflict(true));}",

                    ),/**/
                    array(
                        'packageName'=>'basiinGetAvailableActions',
                        'fileName'=>'basiinGetAvailableActions.js',
                    )
                ),
                'events'=>array(
                         'onAfterInit'=>null, //function,eg: 'js:function(){alert("Hello from the basiin init")}',
                         'onTimeOut'=>null,
                    ),
                'debug'=>Basiin::DEBUG,
                'debuglvl'=>Basiin::DEBUGLVL,
                'homeDomain'=>Yii::app()->request->hostInfo,
                'basiinPath'=>'basiin',
                'filePath'=>'scripts',
                'idDigits'=>Basiin::IdDigits,
            ));

            if(!$rendered)
                throw new CHttpException (500, "sorry, counldn't complete request", 007);
	}

        /**
         *  Retrieves a list of possible actions (packages to install)
         *
         * each action is actually a prettyfied pacakge daclaration.
         * instead of only having packageName,fileName and onAfter onBefore
         * events these objects also undestand:
         *  packageTitle:       the prefered display name (required)
         *  packageTooltip:     prefered a.title attribute (optional, default:pTitle)
         *  packageDescription: additional info to what the package does
         *  onClick:            function to execute before the install happens
         *                      to actually perform the install this func must
         *                      return boolean `true'. Any other value will
         *                      cancel the install
         *
         * @param string $varName basiin response Variable name
         */
        public function actionActions($varName)
        {
            $rendered = Basiin::render($this, array(
                'variableName'=>$varName,
                'success'=>true,
                'data'=>array( //array of action objects
                    array(
                        'packageName'=>'imageCrawler',
                        'packageTitle'=>'Image crawler',
                        'packageTooltip'=>'Save and bookmark images',
                        'fileName'=>'imageCrawler.js',
                        'onAfterInstall'=>'event.basiin.imageCrawler.display()'
                        
                    ),
                    array(
                        'packageName'=>'bookmarker',
                        'fileName'=>'bookmarker.js',
                        'onClick'=>'js:function(){alert("Not implemented for Demo")}'
                    ),
                    array(
                        'packageName'=>'uploader',
                        'fileName'=>'uploader.js',
                        'packageTooltip'=>'upload an arbitrary file',
                        'packageDescription'=>'upload a file',
                        'onClick'=>'js:function(){alert("Not implemented for Demo")}'
                    )

                )
            ));
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
