<?php

/**
 * Controller for the basiin initialization step
 *
 * Usage: host.domain/basiin/init/"nextAction"
 * 
 */
class TransferController extends Controller
{
        public $defaultAction = 'recieve';
        public $layout='//layouts/selfRemove';


        /**
         *  Sets up a new transfer for transaction: $transactionId
         *
         * The rendered view returns a funciton that completes the client side
         * Basiin Transfer object. The returned values are
         * Required:
         * Transfer.id: the saved BTransfer's id that will be used in the last
         *
         * Auxiliary:
         * Transfer.maxPieceLength: if the basiin server want's to dictate a max
         *                          piece length this can be done here.
         * Tranfer.maxActivePieces: if the basiin server want's to limit the
         *                          maximum number of active tranfer elements
         *
         *
         * @param integer $transactionId
         * @param string $varName       The result of basiin's _hash on Transfer.data
         * @param integer $dataLength   The length (byte size) of Transfer.data
         */
        public function actionNew( $transactionId, $varName, $packetLength, $dataLength){
            $transactionId = (integer) $transactionId;
            $dataLength = (integer) $dataLength;
            $packetLength = (integer) $packetLength;

            $transaction = Basiin::getTransaction($transactionId);

            if (!$transaction) throw new CHttpException(404, 
                    "The BTransaction {$transactionId} doesn't exist any more.", 007);


            if (Basiin::canAcceptTransfer($dataLength,$packetLength))
                 $transfer = $transaction->newTransfer($varName,$dataLength,$packetLength);

            

            $rendered = Basiin::renderFile(
                        'packet',$this,array(
                            'variableName'=>$transfer->variable_name,
                            'success'=>true,
                            'data'=>$transfer->id,
                            ),False);

            if(!$rendered)
                throw new CHttpException (500, "sorry, counldn't complete request", 007);
        }

        /**
         * Recieve a packet for an already announced transfer
         *
         * @param integer $transactionId
         * @param integer $transferId       
         * @param integer $packetIndex      
         * @param string $rand              a random seed for the browser side, irrelevant
         * @param integer $decode           int to bool
         * @param string packetData         the actual data
         * @return boolean
         */
        public function actionReceive($transactionId, $transferId, $packetIndex,
                                     $rand, $decode, $packetData)
	{
            $requestValid   = false;
            $result=false;
            $output=array();
            
            $transactionId  = (int) $transactionId;
            $transferId     = (int) $transferId;
            $packetIndex    = (int) $packetIndex;

            $decode = ((int)$decode === 1)? true:false;
            
            $transaction = Basiin::getTransaction ($transactionId);
            $transfer = $transaction->getTransfer ($transferId);

            if ($transfer === false)
                    return false; //just for god measure, failure is handled by gettransfer now

            
            $vars = array(
                'variableName'=>$transfer->variable_name,
                'packetIndex'=>$packetIndex,
                'success'=>$result,
                'output'=> '',
            );
            
            if ($decode) $packetData = rawurldecode ($packetData);
            //BECAUSE_OF_APACHE on js data is enc twice while on serv decoded once

            //since this session has said Transaction & Transfer append $packetData to file
            $file = Yii::getPathOfAlias('basiin.incomming').
                        DIRECTORY_SEPARATOR. $transfer->file_name.'.packet'.$packetIndex;

            $fp = fopen($file,'w');
            $result = fwrite($fp, $packetData);// int or false
            $closed = fclose($fp);

            if (!$closed) //TODO:  fail the transfer or re-initialize
            {
                $vars['output'] = "File didn't close properly! Written:". $result. " bytes. Data length: ". strlen($packetData);
            }
            else
                $vars['output'] = "Written:". $result. " bytes. Data length: ". strlen($packetData);

            
            if(isset($vars['output']))
                $vars['output'] =CJavaScript::encode($vars['output']);
            
            if($result !== false)
            {   
                $vars['success']= true;
                $vars['bytes']= $result;
                $transfer->pieces->setRecieved ($packetIndex);
                $transfer->piece_next++;
                $transfer->access();

                $rendered=Basiin::renderFile('packet', $this, $vars);
                
                if(!$rendered)
                    throw new CHttpException (500, "sorry, counldn't complete request", 007);
            }
            else
                $rendered=Basiin::renderFile('packet', $this, $vars);

            if(!$rendered)
                    throw new CHttpException (500, "sorry, counldn't complete request", 007);
	}


        /**
         *  Tell Basiin that the transfer is completed and what the total $packetCount was.
         *
         * Returns a js object in the transfers return variable that has:
         * hash: a hashed checksum of the file
         * pending: an array of integers describing the packets that haven't been sent yet
         *
         * @param integer $transactionId
         * @param integer $transferId
         * @param integer $packetCount
         */
         public function actionFinalize($transactionId, $transferId, $packetCount)
         {
                $transactionId  = (int) $transactionId;
                $transferId     = (int) $transferId;
                $packetCount    = (int) $packetCount;

                $transaction = Basiin::getTransaction ($transactionId);
                $transfer = $transaction->getTransfer ($transferId);
                $completed = $transfer->pieces->Completed($packetCount);

                $vars = array(
                    'variableName'=>$transfer->variable_name,
                    'success'=>true,
                    'data' => null
                );

                $completed = false;
                if (!$completed)
                {
                    $vars["success"]= false;
                    $vars["data"]= array(
                        'packets'=>$transfer->pieces->getMissingPieces($packetCount),
                    );
                    
                    /**resend test *
                    $vars["success"]= false;
                    $vars["data"]= array( 'packets' =>array(1,2));
                    /* */
                }
                else
                {
                    $basedir = Yii::getPathOfAlias('basiin');
                    $cmd = Yii::getPathOfAlias('basiin.bin'). "/mergeFiles.sh ".
                            "'{$transfer->file_name}' '{$basedir}' 2>&1".
                            " {$basedir}/data/mergeFiles.log &";
                    $vars["output"] = array( $cmd );
                    exec($cmd, $vars["output"], $vars['data']);
                }



                $rendered = Basiin::renderFile('packet', $this, $vars);
                
                if(!$rendered)
                    throw new CHttpException (500, "sorry, counldn't complete request", 007);
         }


         /**
          * Debuging function retuns the length of $data recieved in var ackno..
          * @param string $data
          */
         public function actionAcknowledge($data = "")
         {
                echo 'var acknowledged = '. strlen($data);
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