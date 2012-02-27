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

}
?>
