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
        public function actionNew( $transactionId, $varName, $pieceLength, $dataLength){
            $transactionId = (integer) $transactionId;
            $dataLength = (integer) $dataLength;
            $pieceLength = (integer) $pieceLength;

            $transaction = Basiin::getTransaction($transactionId);

            if (!$transaction) throw new CHttpException(404, 
                    "The BTransaction {$transactionId} doesn't exist any more.", 007);


            if (Basiin::canAcceptTransfer($dataLength,$pieceLength))
                 $transfer = $transaction->newTransfer($varName,$dataLength,$pieceLength);

            

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
        public function actionRecieve($transactionId, $transferTag, $pieceIndex, $pieceData)
	{
            
            $transaction = Basiin::getTransaction ($transactionId);
            $transfer = $transaction->getTransfer ($transferTag);
            if ($transfer === false) $transaction->newTransfer ($transferTag);



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