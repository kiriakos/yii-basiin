<?php

/**
 * Extends CActiveRecord to accomondate for the database
 *
 * @author Kiriakos
 */
class EBasiinActiveRecord extends CActiveRecord {


        public function getDbConnection()
        {
            $db = Yii::app()->controller->module->db;
            return Yii::createComponent($db);
        }

        /**
         *  Propagate the ::model() behavior
         *
         * taken from
         *  http://www.yiiframework.com/doc/api/1.1/CActiveRecord#model-detail
         *
         * @param Class $className
         * @return CActiveRecord
         */
        public static function model($className=__CLASS__)
        {
            return parent::model($className);
        }

}
?>
