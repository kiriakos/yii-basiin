<?php

/**
 * Basiin framework functions singleton
 *
 * This static class provides the gruntwork layer for basiin logic.
 * It incorporates the funcitons:
 *
 *
 * @author Kiriakos
 */
class Basiin{

    /**************************************************************************
     *******************************CONSTANTS**********************************
     **************************************************************************/


    //the total string length if a transfer exceeds this the transfer is
    //canceled and the data forgotten
    const MaxTransferSize = 2000000; //2M bytes
    const MaxPieceSize = 100000; //100K bytes
    const MaxUrlLength = 4000; //4096 doesn't work on some apache configs, for 
                               //higher values you will need to recompile apache

    //How many simultaneous BTransactions can a Session do
    const MaxConcursiveTransactions = 8;
    const TransactionTTL = 1800; //how long after start does cleanup keep the transaction
    
    //How many simultaneous BTransfers can a transaction do
    const MaxConcursiveTransfers = 8;
    const MaxConcursiveTransferPackets = 1; //can't figure out atomic writes to file
    const MaxConcursiveElements = 8;//active script tags (sum of all Transfers)
    const TransferTTL = 1800;// 2min?
    const IdDigits = 9; //used to calculate Packet sizes

    //mostly a js variable set to false on production
    const DEBUG = true;
    const DEBUGLVL = 4;

    
    /**************************************************************************
     ****************************** TRANSFERS *********************************
     **************************************************************************/


    public function canAcceptTransfer( $size , $pieceSize ){

        if ( $size <= self::MaxTransferSize && self::hasStorage($size)
                && $pieceSize <= self::MaxPieceSize )
            return true;

        return false;
    }

    private function hasStorage( $size ){
        //TODO: create a space checking algo... or no need?
        return true;
    }


    /**************************************************************************
     *****************************TRANSACTIONS*********************************
     **************************************************************************/

    /**
     *  Array of the sessions BTransactions or empty array
     * @var BTransaction[]
     */
    private static $transactions = array();

    /**
     *  Returns an array of BTransaction instances in the visitor's session
     * @return BTransaction[]
     */
    public static function getTransactions(){
        return self::$transactions;
    }

    /**
     * Returns a BTransaction from the session's transactions by it's $id
     * @param string $id
     * @return BTransaction
     */
    public static function getTransaction($id, $halt=true){
        
        foreach (self::$transactions as $transaction){
            if ($transaction->id == $id) return $transaction->access();
        }

        if ($halt)
            throw new CHttpException (400, "Sorry, the transaction you are trying to access doesn't exist anymore", 007);

        return false;
    }

    /**
     * Generates a new BTransaction and saves it into session returning the instance
     * @return BTransaction
     */
    public static function newTransaction(){
        if (!self::$initialized) self::startUp ();

        $transaction = new BTransaction();

        self::$transactions[] = $transaction;

        return $transaction;
    }


    /**************************************************************************
     ******************************APP-EVENTS**********************************
     **************************************************************************/


    /**
     * Initializer (sets up the BTransaction objects in $transactions)
     *
     * is called by BasiinModule->beforeControllerAction
     * @return boolean
     */
    public static function startUp(){
        
        if (!self::$initialized)
            self::$initialized  = self::rebuildTransactions(
                    Yii::app()->session['transactions']);
        
        return self::$initialized;
    }
    private static $initialized = null;

    /**
     *  Shut down functions (set session transactions to BTransaction->ids)
     *
     * is called by BasiinModule->afterControllerAction
     * 
     * @return boolean
     */
    public static function shutDown(){
        $transactionsSerialized = self::serializeTransactions();
        if(!$transactionsSerialized && !empty($transactionsSerialized)){
            throw new CHttpException(500, 'Basiin Failed to shutdown', 666);
            return false;
        }else{
            Yii::app()->session['transactions'] = $transactionsSerialized;
            self::$initialized = FALSE;
            return true;
        }
    }

    /**
     * Gets a BTransaction[] from $transactionIds that is an arr from BTransaction->ids
     *
     * if no transactions exist $transactionIds is cast into an array with a null value
     *
     * @param array $transactionIds
     */
    private static function rebuildTransactions(array $transactionIds = null)
    {
        if ( is_array($transactionIds) )
            $transactions = BTransaction::model()->findAllByPk($transactionIds);
        else
            $transactions = array();

        if ( !$transactions ) $transactions = array();

        self::$transactions = $transactions;

        return true;
    }

    /**
     * Return an array of BTransaction->ids that belong to this session
     *
     * called by Basiin::shutDown
     *
     * @return integer[]
     */
    private static function serializeTransactions(){

        $ts = array();

        foreach (self::$transactions as $transaction)
        {
            /* @var $transaction BTransaction */
            if ($transaction->accessed)
            {
                    $transaction->save();
                    $transaction->onAfterSave();
            }
            
            $ts[] = $transaction->id;
        }
        return $ts;
    }

    
    /**************************************************************************
     *****************************MAINTAINANCE*********************************
     **************************************************************************/


    /**
     * unset any transaction id that is timed out or overflowing maxCount
     *
     * @param BTransaction[] $transactions
     */
    private static function cleanupTransactions($transactions = NULL){
        if($transactions === NULL) { //arguments check
            $transactions = self::$transactions;
            $noReturn=True;
        }

        //remove timed out transactions
        foreach ($transactions as $id=>$transaction){
            if ($transaction->timeout < time() )
                    unset($transactions[$id]);
            
            //remove timed out transfers aswell
            self::cleanupTransfers ($transaction);
        }

        // if self::MaxConcursiveTransactions has been reached remove the oldest
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



    /**************************************************************************
     *******************************RENDERER***********************************
     **************************************************************************/

    
    /**
     *  Find a view file from the views available to this controller
     *
     * will check for files prioritizing an exact match > a minified js > js
     * if no hit the $fail value will be returned
     *
     * this is public because controllers should benefit from this functionality
     * also.
     * 
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
        $matchFiles = '/\s"?\$__([[:alnum:]]+)"?/';
        while (preg_match_all($matchFiles, $output, $files)){
            $filesFiltered = array_unique($files[1]);
            rsort($filesFiltered);
            foreach ($filesFiltered as $filee){
                $absFile = self::findViewFile($controller, $controller->id.'.'.$filee, FALSE);
                if ($absFile)
                    $output = str_replace ('$__'.$filee, file_get_contents ($absFile), $output);
                else
                    $output = str_replace ('$__'.$filee, '', $output);
            }
        }
        
        //match $word__prop to data[$word]->prop
        $matchObjects = '/\s"?(\$[[:alnum:]]+__[[:alnum:]_]+)"?/';
        preg_match_all($matchObjects, $output, $objects);
        
        //match $word to data[$word]
        $matchVars = '/\s"?(\$[[:alnum:]]+)"?(?:[^[:alnum:]_\-\.])/';
        //ends @ - also, should be ok since hyphen chars are not allowed in js vars
        preg_match_all($matchVars, $output, $vars);

        
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
        //uniquify & sort $vars array. Revesre sort so biggest varName is first
        $objects = array_unique($objects);
        rsort($objects);

        // replaces $vars with data
        foreach($objects as $object){ 
            $arr = explode('__', $object); // '$word__prop' := {'$word', 'prop'}
            $arr[0] = substr($arr[0], 1); //remove $ sign

            if ( count($arr) == 2 &&
                    isset($data[$arr[0]]) &&
                    is_object($data[$arr[0]]) &&
                    (
                        isset ( $data[$arr[0]]->$arr[1] ) ||
                        method_exists($data[$arr[0]], 'get'.  ucfirst($arr[1]))
                    )
                ){
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
        //uniquify & sort $vars array. Revesre sort so biggest varName is first
        $vars = array_unique($vars);
        rsort($vars);

        // replaces $vars with data
        foreach ($vars as $var){
            $varName = substr($var, 1);// $varName -> varName
            
            if (isset($data[$varName])){
                if (is_string($data[$varName]))
                    $renderProduct = str_replace ($var, $data[$varName], $renderProduct);
                else
                    $renderProduct = str_replace ($var, CJavaScript::encode ($data[$varName]), $renderProduct);
            }elseif($stopOnError){
                throw new CHttpException(500, "the data {$var} could not be found", 007);
            }else{
                $renderProduct = str_replace ($var, 'null', $renderProduct);
            }
        }

        return $renderProduct;
    }

}



