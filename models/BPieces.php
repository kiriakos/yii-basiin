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
}