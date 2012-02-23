<?php

/**
 * This is the model class for table "basiin_transaction".
 *
 * The followings are the available columns in table 'basiin_transaction':
 * @property integer $id
 * @property integer $started
 * @property integer $timeout
 *
 * The followings are the available model relations:
 * @property Transfer[] $transfers
 */
class Transaction extends BasiinActiveRecord
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
			'transfers' => array(self::HAS_MANY, 'Transfer', 'transaction_id'),
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
	 * Retrieves a list of models based on the current search/filter conditions.
	 * @return CActiveDataProvider the data provider that can return the models based on the search/filter conditions.
	 */
	public function search()
	{
		// Warning: Please modify the following code to remove attributes that
		// should not be searched.

		$criteria=new CDbCriteria;

		$criteria->compare('id',$this->id);
		$criteria->compare('started',$this->started);
		$criteria->compare('timeout',$this->timeout);

		return new CActiveDataProvider($this, array(
			'criteria'=>$criteria,
		));
	}
}