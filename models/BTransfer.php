<?php

/**
 * This is the model class for table "basiin_transfer".
 *
 * The followings are the available columns in table 'basiin_transfer':
 * @property integer $id
 * @property integer $transaction_id
 * @property integer $started
 * @property integer $timeout
 * @property string $file
 * @property integer $piece_count
 * @property integer $piece_size
 * @property string $variable_name
 *
 * The followings are the available model relations:
 * @property Pieces $pieces
 * @property Transaction $transaction
 */
class BTransfer extends EBasiinActiveRecord
{
        public function  __construct($scenario = 'insert') {
            parent::__construct($scenario);

            //if new entry ad started
            if ($this->isNewRecord()) $this->started = time();

            //timeout must be updated on evey call.
            $this->setTimeout();
        }
	/**
	 * Returns the static model of the specified AR class.
	 * @return Transfer the static model class
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
		return 'basiin_transfer';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('transaction_id, started, timeout, file, piece_count, piece_size, variable_name', 'required'),
			array('transaction_id, started, timeout, piece_count, piece_size', 'numerical', 'integerOnly'=>true),
			array('file, variable_name', 'length', 'max'=>40),
			// The following rule is used by search().
			// Please remove those attributes that should not be searched.
			array('', 'safe', 'on'=>'search'),
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
			'pieces' => array(self::HAS_ONE, 'BPieces', 'transfer_id'),
			'transaction' => array(self::BELONGS_TO, 'BTransaction', 'transaction_id'),
		);
	}

	/**
	 * @return array customized attribute labels (name=>label)
	 */
	public function attributeLabels()
	{
		return array(
			'id' => 'ID',
			'transaction_id' => 'Transaction',
			'started' => 'Started',
			'timeout' => 'Timeout',
			'file' => 'File',
			'piece_count' => 'Piece Count',
			'piece_size' => 'Piece Size',
			'variable_name' => 'Variable Name',
		);
	}

	/**
	 * Retrieves a list of models based on the current search/filter conditions.
	 * @return CActiveDataProvider the data provider that can return the
         *                             models based on the search/filter
         *                             conditions.
	 */
	public function search()
	{
		// Warning: Please modify the following code to remove attributes that
		// should not be searched.

		$criteria=new CDbCriteria;

		return new CActiveDataProvider($this, array(
			'criteria'=>$criteria,
		));
	}

        /**
         * Set timeout
         */
        public function setTimeout(){
            if(!is_numeric($this->timeout) || $this->timeout > time())
                $this->timeout = time() + Basiin::TransferTTL;
            else
                $this->timeout=false;
            
            return $this->timeout;
        }

        /**
         * Load BTransfer with it's BPieces objects eagerly, automatically, and in one query
         * @return string
         */
        public function defaultScope(){
            return 'withPieces';
        }

        public function scopes(){

            return array(
                'withPieces'=>array(
                    'with'=>'pieces',
                    'together'=>'true',
                    'criteria'=>'timeout > '.time(),
                ),
            );
        }

}