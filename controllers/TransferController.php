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
                        'new',$this,array(
                            'transfer'=>$transfer
                            ),False);

            if(!$rendered)
                throw new CHttpException (500, "sorry, counldn't complete request", 007);
        }

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
        public function actionReceive($transactionId, $transferId, $packetIndex,
                                     $rand, $startChar, $decode, $packetData)
	{
            //die(var_dump($packetData));
            $transactionId  = (int) $transactionId;
            $transferId     = (int) $transferId;
            $packetIndex    = (int) $packetIndex;
            $startChar      = (int) $startChar;

            $decode = ((int)$decode === 1)? true:false;
            $transaction = Basiin::getTransaction ($transactionId);
            $transfer = $transaction->getTransfer ($transferId);

            if ($transfer === false)
                throw new CHttpException (400, "Transfer/recieve: sorry, the transfer you are trying to access doesn't exist anymore", 007);

            
            if ($decode) $packetData = rawurldecode ($packetData);
            $packetData = rawurldecode ($packetData);//BECAUSE_OF_APACHE
            
            $packetData = escapeshellarg($packetData);//IS_THIS_PROBLEMATIC?

            //since this session has said Transaction & Transfer append $packetData to file
            $file = Yii::getPathOfAlias('basiin.incomming').
                        DIRECTORY_SEPARATOR. $transfer->file_name;

            $start= $startChar;
            
            $command = Yii::getPathOfAlias('basiin.bin'). DIRECTORY_SEPARATOR;
            $command.= "append.sh \"${file}\" \"${start}\" ${packetData} 2>&1";
            

            $result=null;
            $output=array();
            exec($command, $output, $result);

            //if the scrip succeded set $result to true
            $result= ($result===0)?true:$result; 

            $vars = array(
                    'transfer'=>$transfer,
                    'packetIndex'=>$packetIndex,
                    'hash'=>true,
                    'output'=> str_replace('"', '\'', implode(' \n', $output). " result:". $result),
                );

            if($result === true)
            {
                $transfer->pieces->setRecieved ($packetIndex);
                
                $rendered=Basiin::renderFile('recieve', $this, $vars);

                if(!$rendered)
                    throw new CHttpException (500, "sorry, counldn't complete request", 007);
            }
            else
                $rendered=Basiin::renderFile('recieve', $this, $vars);

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

                $transaction = Basiin::getTransaction ($transactionId);
                $transfer = $transaction->getTransfer ($transferId);
                $finalized = $transfer->pieces->Completed((int) $packetCount);
                
                
                
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