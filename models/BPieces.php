<?php

/**
 * This is the model class for table "basiin_pieces".
 *
 * The followings are the available columns in table 'basiin_pieces':
 * @property integer $transfer_id
 * @property string $pieces
 *
 * The followings are the available model relations:
 * @property Transfer $transfer
 */
class BPieces extends EBasiinActiveRecord
{
	/**
	 * Returns the static model of the specified AR class.
	 * @return Pieces the static model class
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
		return 'basiin_pieces';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('pieces', 'safe'),
			// The following rule is used by search().
			// Please remove those attributes that should not be searched.
			array('transfer_id, pieces', 'safe', 'on'=>'search'),
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
			'transfer' => array(self::BELONGS_TO, 'Transfer', 'transfer_id'),
		);
	}

	/**
	 * @return array customized attribute labels (name=>label)
	 */
	public function attributeLabels()
	{
		return array(
			'transfer_id' => 'Transfer',
			'pieces' => 'Pieces',
		);
	}

	/**
	 * Retrieves a list of models based on the current search/filter conditions.
	 * @return CActiveDataProvider the data provider that can return the models based on the search/filter conditions.
	 */
	public function search()
	{
		// Warning: Please modify the following code to remove attributes that
		// should not be searched.

		$criteria=new CDbCriteria;

		$criteria->compare('transfer_id',$this->transfer_id);
		$criteria->compare('pieces',$this->pieces,true);

		return new CActiveDataProvider($this, array(
			'criteria'=>$criteria,
		));
	}


        /**
         *  Generates a piece status string
         * @param integer $length
         * @return string
         */
        public function createPieceString($length){
            $arr = array();
            //create an array of $length
            while (count($arr) < $length)
                $arr[]=0;
            
            //return imploded array
            return implode('', $arr);
        }


        /**
         *  Returns true if the piece at $index has been received (==1)
         * @param integer $index
         * @return boolean
         */
        public function getReceived($index){
            return ( substr($this->pieces, $index -1 , 1) == 1 );
        }

        /**
         *  Sets the piece flag of piece $index to 1 (received) returns the pieces string
         *
         * Will pad the pieces string if a too big index is given
         * @param integer $index
         * @return string 
         */
        public function setReceived($index){

            $this->accessed = true;
            $pieceCount = strlen($this->pieces);

            if ($index<0) return false;
            if ($index > $pieceCount) //pad the pieces string if the initial estimation went overboard
            {
                $overflow = $index - $pieceCount ;
                $extra = $this->createPieceString($overflow);
                $this->pieces.= $extra;
            }

            $this->pieces = substr_replace( $this->pieces, 1, $index , 1);

            return $this->pieces;
        }

        /**
         *  Check if all teh pieces have been received
         *
         * Checks if all pieces have been received. The $finalPieces argument
         * is there because Basiin can't know how many pieces the transfer will
         * need from the begining (since the user front end doesn't read the
         * transfer stream)
         *
         * @param integer $finalPieces
         * @return mixed
         */
        public function Completed($finalPieces){

            // === because strpos can return (string) "0" is substring is found
            // @ begining of haystack. "0" is falsey so type checking is needed
            return
            (
                strpos( substr($this->pieces, 0, $finalPieces), '0') === FALSE
            );

        }

        /**
         *  Get the missing piece indexes for $pieceCount pieces from $offset.
         *
         * returns an array of pieces that haven't been received yet.
         *
         * @param integer $pieceCount
         * @param integer $offset
         * @return array
         */
        public function getMissingPieces( $pieceCount, $offset = 0){
            $results = array();
            $string = substr($this->pieces, 0, $pieceCount );
            $offset = 0;
            
            while (($piece = strpos($string, '0', $offset)) !==false )
            {
                $results[]=$piece;
                $offset = $piece+1;
            }
            return $results;
        }


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
        public function access($readonly=false)
        {
            if ($this->accessed == false)
                $this->accessed=!$readonly;

            return $this;
        }
}