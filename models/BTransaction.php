<?php

/**
 * This is the model class for table "basiin_transaction".
 *
 * The followings are the available columns in table 'basiin_transaction':
 * @property integer $id
 * @property integer $started
 * @property integer $timeout
 * 
 *
 * The followings are the available model relations:
 * @property Transfer[] $transfers
 */
class BTransaction extends EBasiinActiveRecord
{
        
        /**
	 * Returns the static model of the specified AR class.
	 * @return Transaction the static model class
	 */
	public static function model($className=__CLASS__)
	{
		return parent::model($className);
	}

	/**
	 * @return string the associated database table name
	 */
	public function tableName()
	{
		return 'basiin_transaction';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('started, timeout', 'required'),
			array('started, timeout', 'numerical', 'integerOnly'=>true),
			// The following rule is used by search().
			// Please remove those attributes that should not be searched.
			array('id, started, timeout', 'safe', 'on'=>'search'),
		);
	}

	/**
	 * @return array relational rules.
	 */
	public function relations()
	{
		// NOTE: you may need to adjust the relation name and the related
		// class name for the relations automatically generated below.
		return array(
			'transfers' => array(self::HAS_MANY, 'BTransfer', 'transaction_id'),
		);
	}

	/**
	 * @return array customized attribute labels (name=>label)
	 */
	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'started' => 'Started',
			'timeout' => 'Timeout',
		);
	}

        /**
         * Load BTransfer with it's BPieces objects eagerly, automatically, and in one query
         * @return string
         */
        public function defaultScope(){
            return array(
                //the active scope. Why can't I assign scopes by name here?
                'with'=>'transfers',
                'together'=>'true',
                'condition'=>'t.timeout > '.time(),
                );
        }

        public function scopes(){

            return array(
                'withTransfers'=>array(
                    'with'=>'transfers',
                    'together'=>'true',
                    'condition'=>'t.timeout > '.time(),
                ),
                'active'=>array(
                    'condition'=>'t.timeout > '.time(),
                )
            );
        }

    /**************************************************************************
     *****************************MODEL-EVENTS*********************************
     **************************************************************************/

        /**
         * HACK: called by basiin::serializeTransactions manually
         *
         *
         */
        public function  onAfterSave() {
            //hack, doesn't need to raise the system events
            //parent::onAfterSave();

            foreach ($this->transfers as $transfer)
            {
                if ($transfer->accessed)
                {
                        $transfer->save();
                        $transfer->onAfterSave();
                }
            }
            $this->accessed = false;

        }

        /**
         *  If the transaction is saved also save all of its transfers
         *
         * This has a side effect of perpetuating the timeout of all the
         * transfers in the transaction. Since the transaction is active this
         * should be default behavior.
         *
         * @param CEvent $event
         */
        public function onAfterValidate($event)
        {
            parent::onAfterValidate($event);
            
            
        }

        /**
         *  Last minute attrib changes + newRecord Initialization
         * @param CEvent $event
         */
        public function  onBeforeValidate($event) 
        {
            if ($this->isNewRecord){
                $this->started = time();
            }
            $this->setTimeout(); //always update timeout

            parent::onBeforeValidate($event);

        }

        //DOESNTWORK
        public function  onAfterConstruct($event) {
            die('onAfterConstruct');
            parent::onAfterConstruct($event);
        }
        //DOESNTWORK
        public function  onBeforeSave($event) {
            parent::onBeforeSave($event);
            die( "obs transaction:".$this->id );
        }



    /**************************************************************************
     *************************** Functionality ********************************
     **************************************************************************/


        /**
         *  Flag, true if the Transaction has been accesed and should be saved
         * @var boolean
         */
        private $accessed=false;
        public function getAccessed(){return $this->accessed;}
        /**
         *  Mark the object as accessed, save on Basiin::shutdown
         * @return BTransaction
         */
        public function access(){
            $this->accessed=true;
            return $this;
        }
        
        
        /**
         *  The path to which to send data to
         * @return string
         */
        public function getDefaultPath(){
            return 'basiin/tell/'.$this->id;
        }

        /**
         * Set timeout
         */
        private function setTimeout(){
            if(
                $this->timeout !== 0 && // happens when the object timed out
                ( !is_numeric($this->timeout) || $this->timeout > time())
            )
                $this->timeout = time() + Basiin::TransferTTL;
            else
                //if the object timed out set timeout value to 0 to avoid reactivating a dead object
                $this->timeout=0;

            return $this->timeout;
        }
        
        /**
         *  Returns the transfer with the requested $id or False
         *
         * @param string $id
         * @return BTransfer false
         */
        public function getTransfer( $id, $halt=true, $readonly=false){
            
            foreach ($this->transfers as $transfer)
                    if ($transfer->id == $id) return $transfer->access($readonly);

            if ($halt)
                    throw new CHttpException (400, "Sorry, the transfer you are trying to access doesn't exist anymore", 007);


            return false;
        }

        /**
         * Creates a BTransfer with $tag ($data) and appends it to the transaction
         * @param string $tag
         * @param string $data
         * @return BTransfer
         */
        public function newTransfer( $varName, $dataLength, $pieceLength){

            $transfer = new BTransfer();
            $transfer->initialize($varName, $dataLength, $pieceLength, $this->id);
            
            return $transfer;
        }


        //getters needed by the renderer

        public function getMaxTransfers(){
            return Basiin::MaxConcursiveTransfers;
        }
        public function getMaxElements(){
            return Basiin::MaxConcursiveElements;
        }
        public function getMaxTransferElements(){
            return Basiin::MaxConcursiveTransferPackets;
        }
        /**
         *  return the AR id, probably this was protected since it's a Primary key
         * $return integer
         */
        public function getId()
        { return str_pad( (string)$this->id, Basiin::IdDigits, '0', STR_PAD_LEFT); }
        /**
         * Return the trasaction's TTL
         *
         * Wrapper function to Basiin::TransactionTTL
         * @return integer
         */
        public function getTTL(){ return Basiin::TransactionTTL; }
        public function getTransferTTL(){ return Basiin::TransferTTL; }
        public function getServerPaths(){
            $paths = array(
                'location'=> Yii::app()->request->hostInfo,

                'iconPath'=> Basiin::IconDirectory,
                'filePath'=> Basiin::ScriptDirectory,
                
                'domain'=> Yii::app()->request->hostInfo,
                'basiin'=> "basiin",//?
                
                //where data goes when path not set
                'tell'=> $this->getDefaultPath(),

                //acknowledge/ping/conection debug
                'ack'=> "basiin/ack",

            );
            return $paths;
        }
}