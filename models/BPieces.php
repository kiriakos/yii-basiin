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
class BPieces extends BasiinActiveRecord
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
        public function createPieceString(integer $length){
            $arr = array();
            //create an array of $length
            while (count($arr) > $length)
                $arr[]=0;

            //return imploded array
            return implode('', $arr);
        }


        /**
         *  Returns true if the piece at $index has been recieved (==1)
         * @param integer $index
         * @return boolean
         */
        public function getRecieved(integer $index){
            return ( substr($this->pieces, $index -1 , 1) == 1 );
        }

        /**
         *  Sets the piece flag of piece $index to 1 (recieved) returns the pieces string
         * @param integer $index
         * @return string 
         */
        public function setRecieved(integer $index){

            if ($index<1 || $index > strlen($this->pieces) ) return false;

            $this->pieces = substr_replace( $this->pieces, 1, $index -1, 1);

            return $this->pieces;
        }

        public function Completed(){

            // === because strpos can return (string) "0" is substring is found
            // @ begining of haystack. "0" is falsey so type checking is needed
            return (strpos($this->pieces, '0') === FALSE );

        }
}