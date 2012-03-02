<?php

/**
 * This is the model class for table "basiin_transfer".
 *
 * The followings are the available columns in table 'basiin_transfer':
 * @property integer $id
 * @property integer $transaction_id
 * @property integer $started
 * @property integer $timeout
 * @property string $file_name
 * @property integer $file_size
 * @property integer $piece_count
 * @property integer $piece_size
 * @property string $variable_name
 *
 * The followings are the available model relations:
 * @property BPieces $pieces
 * @property Transaction $transaction
 */
class BTransfer extends EBasiinActiveRecord
{

    /**************************************************************************
     **************************** Yii specififc *******************************
     **************************************************************************/

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
			array('transaction_id, started, timeout, file_name, file_size , piece_count, piece_size, variable_name', 'required'),
			array('transaction_id, started, timeout, piece_count, piece_size, file_size', 'numerical', 'integerOnly'=>true),
			array('file_name, variable_name', 'length', 'max'=>40),
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
			'file_name' => 'File',
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
         * Load BTransfer with it's BPieces objects eagerly, automatically, and in one query
         * @return string
         */
        public function defaultScope(){
            return array(
                    'with'=>'pieces',
                    'together'=>'true',
                    'condition'=>'t.timeout > '.time(),
                );
        }

        public function scopes(){

            return array(
                'withPieces'=>array(
                    'with'=>'pieces',
                    'together'=>'true',
                    'condition'=>'t.timeout > '.time(),
                ),
            );
        }

        
    /**************************************************************************
     *****************************Model-events*********************************
     **************************************************************************/

        /**
         *  On construct set the started property of the transfer
         * @param CEvent $event
         */
        public function  onAfterConstruct($event) {
            parent::onAfterConstruct($event);
        }

        /**
         *  Prepare the transfer object for saving
         * @param CEvent $event
         */
        public function  onBeforeSave($event) {
            parent::onBeforeSave($event);

            $this->setTimeout();
        }

        /**
         *  Save the BPieces pieces as well as the Transfer row
         * @param CEvent $event
         */
        public function  onAfterSave($event) {
            parent::onAfterSave($event);

            if(!$this->pieces){
                $pieces = new BPieces ();
                $pieces->transfer_id = $this->id;
                $pieces->pieces = $pieces->createPieceString($this->piece_count);
            }
            $this->pieces->save();
        }

    /**************************************************************************
     ************************ Model-funcitonality *****************************
     **************************************************************************/

        /**
         *  return the AR id, probably this was protected since it's a Primary key
         * $return integer
         */
        public function getId()
        { return str_pad( (string)$this->id, Basiin::IdDigits, '0', STR_PAD_LEFT); }
        
        public function getVariable_name()
        { return (string)$this->variable_name; }

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
         *  Set up the transfer's basic parameters
         * @param string $varName
         * @param integer $dataLength
         * @param integer $pieceLength
         */
        public function initialize( $varName, $dataLength, $pieceLength, $transactionId ){

            $this->transaction_id = $transactionId;
            $this->variable_name = $varName;
            $this->piece_size = $pieceLength;
            $this->file_size = $dataLength;
            $this->file_name = $this->generateFileName($varName, $transactionId);
            $this->piece_count = $this->calculatePieceCount($pieceLength, $dataLength);
            $this->started = time();
            $this->timeout = time();

            touch(Yii::getPathOfAlias('basiin.incomming.'.$this->file_name));

        }

        /**
         *  Generates a file name that can be used to store the temporary data
         * @param string $varName
         * @return string
         */
        public function generateFileName( $varName, $transactionId){
            $incommingDir = Yii::getPathOfAlias('basiin.incomming');
            $fileName = sha1( $varName. microtime(). $transactionId );

            while ( file_exists($incommingDir.DIRECTORY_SEPARATOR.$fileName) )
                $fileName = sha1( $varName. microtime(). $transactionId );

            return $fileName;
        }


        /**
         *  Calculate the number of pieces required
         * @param integer $pieces   length of the pieces
         * @param integer $size     lenght of the transfer data
         * @return integer
         */
        public function calculatePieceCount( $pieces, $size){
            return (integer) ceil( $size / $pieces);
        }
}