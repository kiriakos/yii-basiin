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
        public function  __construct($scenario = 'insert') {
            //populates the properties & init()
            parent::__construct($scenario); 

            //if new entry ad started
            if ($this->isNewRecord()) $this->started = time();

            //timeout must be updated on evey call.
            $this->setTimeout();
            
        }

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
         * The path to which to send data to
         * @return string
         */
        public function getDefaultPath(){
            return 'basiin/tell/'.$this->id;

        }

        /**
         * Set timeout
         */
        public function setTimeout(){
            $this->timeout = time() + Basiin::TransactionTTL;
        }


        /**
         *  Returns the transfer with the correct $tag or False
         * @param string $tag
         * @return BTransfer false
         */
        public function getTransfer($id){
            foreach ($this->transfers as $transfer)
                    if ($transfer->id == $id) return $transfer;

            return false;
        }

        /**
         * Creates a BTransfer with $tag ($data) and appends it to the transaction
         * @param string $tag
         * @param string $data
         * @return BTransfer
         */
        public function newTransfer(){

            $transfer = new BTransfer();

            $this->transfers[] =$transfer;

            return $transfer;
        }

        /**
         * Load BTransfer with it's BPieces objects eagerly, automatically, and in one query
         * @return string
         */
        public function defaultScope(){
            return 'withTransfers';
        }

        public function scopes(){

            return array(
                'withTransfers'=>array(
                    'with'=>'transfers',
                    'together'=>'true',
                    'criteria'=>'timeout > '.time(),
                ),
            );
        }
}