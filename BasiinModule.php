<?php

class BasiinModule extends CWebModule
{

        public $db;
        
	public function init()
	{
         	// import the module-level models and components
		$this->setImport(array(
			'basiin.models.*',
			'basiin.components.*',
		));

                //die(var_dump(json_decode(Yii::app()->session['transactions'])));
                
	}

        /**
         * Load the Transactions from session storage
         */
	public function beforeControllerAction($controller, $action)
	{
                $init = Basiin::startUp();

                if($init == false)
                    die('Basiin initialization failed');
                else{
                    if(parent::beforeControllerAction($controller, $action))
                        return true;
                    else
                        return false;
                }
	}

        /**
         * Write the transactions to session storage
         */
	public function afterControllerAction($controller, $action)
	{
                $shutDown = Basiin::shutDown();

                if($shutDown === FALSE)
                    die('basiinFailed to shut down');
                else{    
                    if(parent::afterControllerAction($controller, $action))
                        return true;
                    else
                        return false;
                }
	}
}
