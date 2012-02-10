<?php

/**
 * Basiin framework functions singleton
 *
 * This static class provides the gruntwork layer for basiin logic.
 * It incorporates the funcitons:
 *
 * @static @method generateTransactionId()
 * @static @method getTransactions()
 * @static @param BTransaction[] $transactions
 *
 * @author Kiriakos
 */
class Basiin{
    //the total string length if a transfer exceeds this the transfer is
    //canceled and the data forgotten
    const MaxTransferSize = 1000000; //1M bytes

    //How many simultaneous BTransactions can a Session do
    const MaxConcursiveTransactions = 8;
    const TransactionTimeOutSec = 300; //how long after start does cleanup keep the transaction
    
    //How many simultaneous BTransfers can a transaction do
    const MaxConcursiveTransfers = 4;
    const MaxConcursiveElements = 8;//active script tags (sum of all Transfers)
    const TransferTimeOutSec = 120;
    
    //Array, populated by BasiinModule->beforeControllerAction() that calls Basiin::rebuildTransactions
    private static $transactions = array();

    /**
     * Returns a string that will uniquely identify a transaction
     *
     * ATM 14 chars, first always a char
     * @return string 
     */
    public static function generateTransactionId(){
        
        return self::generateRandomChar().uniqid();
    }

    /**
     * Returns a string that will uniquely identify a transfer
     *
     * TODO: find a usefull/meaningful generation algo
     *
     * ATM is just a wrapper for self::generateTransactionId()
     */
    public static function generateTransferTag(){
        
        return self::generateTransactionId();
    }

    /**
     * a-zA-Z char randomizer
     * @param <type> $array
     * @return string
     */
    private static function generateRandomChar($array = false){
        $chars = array("q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "l", "k", "j",
            "h", "g", "f", "d", "s", "a", "z", "x", "c", "v", "b", "n", "m",
            "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "L", "K", "J",
            "H", "G", "F", "D", "S", "A", "Z", "X", "C", "V", "B", "N", "M");
        shuffle($chars);
        
        if ($array) return $chars;
        else return $chars[0];
    }


    /**
     *  Initializer
     *
     * is called by BasiinModule->beforeControllerAction
     * @return boolean
     */
    public static function init(){
        // internal init
        self::$initialized = True;

        // extrenal init
        self::rebuildTransactions(Yii::app()->session['transactions']);
        
        return true;
    }
    private static $initialized = NULL;

    /**
     *  Shut down functions
     *
     * is called by BasiinModule->afterControllerAction
     * @return boolean
     */
    public static function shutDown(){
        $transactionsSerialized = self::serializeTransactions();
        if(!$transactionsSerialized){
            throw new CHttpException(500, 'Basiin Failed to shutdown', 666);
            return false;
        }else{
            Yii::app()->session['transactions'] = $transactionsSerialized;
            self::$initialized = FALSE;
            return true;
        }
    }

    /**
     *  Returns an array of BTransaction instances in the visitor's session
     * @return BTransaction[]
     */
    public static function getTransactions(){
        return self::$transactions;
    }

    /**
     * Returns a transaction from the sessions transaction by it's id
     * 
     * @param string $id
     * @return BTransaction
     */
    public static function getTransaction($id){
        
        foreach (self::$transactions as $key=>$transaction){
            if ($key === $id) return $transaction;
        }
        
        return false;
    }

    /**
     * Generates a new BTransaction and saves it into session returning the instance
     * @return BTransaction
     */
    public static function newTransaction(){
        if (!self::$initialized) self::init ();
        
        $transaction = new BTransaction();
        
        self::$transactions[$transaction->id] = $transaction;
        // memory maintenance, forget old or overflowing transactions
        self::cleanupTransactions();

        return $transaction;
    }
    

    /**
     * Make sure transactions are less than MaxConcursiveTransactions and Transf
     *
     * @param BTransaction[] $transactions
     */
    private static function cleanupTransactions($transactions = NULL){
        if($transactions === NULL) {
            $transactions = self::$transactions;
            $noReturn=True;
        }

        //remove timed out transactions
        foreach ($transactions as $id=>$transaction){
            if ($transaction->started < time() - self::TransactionTimeOutSec )
                    unset($transactions[$id]);

            self::cleanupTransfers ($transaction);
        }
        
        while ( count( $transactions ) > self::MaxConcursiveTransactions){
            array_shift($transactions);
        }

        
        if(isset($noReturn)){
            return (self::$transactions = $transactions); //update self
        }else{
            return $transactions; //else return
        }
    }
    
    /**
     * Make sure transfers are less than MaxConcursiveTransfers
     */
    private static function cleanupTransfers(&$transaction){
        while (count( $transaction->transfers ) > self::MaxConcursiveTransfers){
            array_shift($transaction->transfers);
        }

        return true;
    }

    /**
     * Builds the sessions transaction pool from serialized session storage
     *
     * the session storage is a encoded json string
     */
    private static function rebuildTransactions($transactions){
       $trs = json_decode($transactions);
       $result = array();
       
       if (!is_array($trs) && !is_object($trs)) return true;

       foreach ($trs as $id=>$transaction)
           $result[$id] = new BTransaction ($id,$transaction);
       
       self::$transactions = $result;

       return true;
    }

    /**
     * takes self::$transactions and json encodes them
     *
     * called by Basiin::shutDown
     */
    private static function serializeTransactions(){
        $trs = array(); //represents self::$transf...
        
        foreach ( self::$transactions as $id=>$transaction ){
            $trs[$id] = $transaction->package(); //represents a BTransf...
        }
        
        $trs = json_encode($trs);
        
        return $trs;
    }

    /**
     *  Find a view file from the views available to this controller
     *
     * will check for files prioritizing an exact match > a minified js > js
     * if no hit the $fail value will be returned
     * @param CController $controller
     * @param string $file
     * @param mixed $fail
     * @return mixed
     */
    public static function findViewFile($controller, $file, $fail = null){
        $absFile = $controller->getViewPath().'/'.$file;
        if (!file_exists($absFile)){ //if the passed filename isn;t valid
            if (file_exists($absFile.'.min.js')){ //prioritize min files
                $absFile = $absFile.'.min.js';
            }elseif (file_exists($absFile.'.js')){ //settle for normal
                $absFile = $absFile.'.js';
            }elseif($fail === TRUE){
                //TODO: error handling
                throw new CHttpException (404, "the view file $file does not exist", 007);
                return false;
            }else
                return $fail;
        }

        return $absFile;
    }

    /**
     *  Renders a Basiin view file
     *
     * Outputs a basiin view file while automatically replacing all
     * $vars with $data[$vars] and
     * $var__param eith $data[$var]->param (note double underdash __ not _)
     *
     * @param string $file
     * @param CController $controller
     * @param array $data
     * @param boolean $stopOnError  defaults to False if true the replacing
     *                              functions will throw a CHttpException when
     *                              faced with an unknown $var
     * @return mixed
     */
    public static function renderFile($file, $controller, $data = NULL, $returnOutput = FALSE, $stopOnError = FALSE){

        $absFile = self::findViewFile($controller, $file, TRUE);
        
        $output = $controller->renderFile($absFile, NULL, TRUE);

        //NOTE: to use $var in render files you have to precede it by whitespace
        //even if it is doubleqouted
        //match files
        $regexp = '/\s"?\$__([[:alnum:]]+)"?/';
        preg_match_all($regexp, $output, $files);
        foreach ($files[1] as $filee){
            $absFile = self::findViewFile($controller, $controller->id.'.'.$filee, FALSE);
            if ($absFile)
                $output = str_replace ('$__'.$filee, file_get_contents ($absFile), $output);
        }
        
        //match $word__prop to data[$word]->prop
        $regexp = '/\s"?(\$[[:alnum:]]+__[[:alnum:]]+)"?/';
        preg_match_all($regexp, $output, $objects);
        
        //match $word to data[$word]
        $regexp = '/\s"?(\$[[:alnum:]]+)"?(?:[^[:alnum:]_\-\.])/';
        ////ends @ - also, should be ok since hyphen chars are not allowed in js vars
        preg_match_all($regexp, $output, $vars);

        
        $output = self::replaceRenderedObjects( $output, $data, $objects[1], $stopOnError );
        $output = self::replaceRenderedVars($output, $data, $vars[1], $stopOnError );
        
        if($returnOutput)
            return $output;
        else
            echo $output;

        return true;
    }

    /**
     *  Return $renderProduct with all $obj__param ref substituted by real values
     *
     * @param string $renderProduct
     * @param array $data
     * @param array $objects array( '$var__param', '$obj__prop', '$you__gotit' )
     * @param boolean $stopOnError See Basiin::renderFile$stopOnError
     * @return string
     */
    private static function replaceRenderedObjects( $renderProduct, $data, $objects, $stopOnError){

        foreach($objects as $object){ 
            $arr = explode('__', $object); // '$word__prop' := {'$word', 'prop'}
            $arr[0] = substr($arr[0], 1);
            
            if ( count($arr) == 2 && 
                    isset($data[$arr[0]]) &&
                    is_object($data[$arr[0]]) &&
                    (property_exists ( $data[$arr[0]] , $arr[1] ) ||
                    method_exists($data[$arr[0]], 'get'.  ucfirst($arr[1]))) ){
                if (is_string($data[$arr[0]]->$arr[1]))
                    $renderProduct = str_replace( $object,
                        $data[$arr[0]]->$arr[1], $renderProduct);
                else
                    $renderProduct = str_replace( $object,
                        CJavaScript::encode ($data[$arr[0]]->$arr[1]), $renderProduct);
            }elseif($stopOnError){
                throw new CHttpException(500, "the data $${arr[0]}->${arr[1]} could not be found", 007);
            }else{
                //set unknown assets to null?
                $renderProduct = str_replace( $object, 'null', $renderProduct);
            }
        }

        return $renderProduct;
    }

    /**
     * Replace $var with its value in $data[var]
     *
     * @param string $renderProduct
     * @param array $data
     * @param array $vars
     * @param boolean $stopOnError See Basiin::renderFile$stopOnError
     * @return string
     */
    private static function replaceRenderedVars ($renderProduct, $data, $vars, $stopOnError){
        foreach ($vars as $var){
            $varName = substr($var, 1);// $varName -> varName
            if (isset($data[$varName])){
                if (is_string($data[$varName]))
                    $renderProduct = str_replace($var, $data[$varName], $renderProduct);
                else
                    $renderProduct = str_replace($var, CJavaScript::encode ($data[$varName]), $renderProduct);
            }elseif($stopOnError){
                throw new CHttpException(500, "the data ${var} could not be found", 007);
            }else{
                $renderProduct = str_replace($var, 'null', $renderProduct);
            }
        }

        return $renderProduct;
    }

}
?>
