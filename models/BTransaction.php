<?php

/**
 * Basiin Transaction object
 *
 * one of theese is created inside the user's session (persistent local store)
 * for each transaction that is started
 *
 * @property BTransfer[] $transfers
 * @property string $id
 * @property boolean $keepAlive when true Basiin js is set up to call home and
 *                              keep the transaction alive
 * @property integer $started timestamp of the time the BT was initiated
 * @property integer $ttl time to live of transaction basiin::TransactionTimeOutSec
 * @property integer $maxTransfers how many transfers can be initiated?
 * @property integer $maxElements how many elements can be actively transfering?
 *
 * @method string getDefaultPath return a valid url to wich basiin can send data
 * 
 * @author Kiriakos
 */
class BTransaction {
    protected $id;
    public $ttl;
    public $maxTransfers;
    public $maxElements;
    protected $started;
    protected $keepAlive = False;
        public function setKeepAlive($b){return ($this->keepAlive = (bool)$b);}
        public function getKeepAlive(){return $this->keepAlive;}
    public $transfers = array();

    
    public function __construct($id = NULL, $data = NULL) {
        if($id===NULL) $id = Basiin::generateTransactionId();
        $this->id = $id;
        if ($data !== NULL)
            $this->unpack($data);
        else
            $this->_initialize();

        $this->ttl = Basiin::TransactionTimeOutSec;
        $this->maxTransfers = Basiin::MaxConcursiveTransfers;
        $this->maxElements = Basiin::MaxConcursiveElements;
    }
    
    public function __get($name){
        $getter = 'get'.  ucfirst($name);
        if(property_exists($this, $name))
                return $this->$name;
        if (method_exists($this, $getter))
                return $this->$getter();

        return NULL;
    }

    /**
     * The path to which to send data to
     * @return string
     */
    public function getDefaultPath(){
        return Yii::app()->request->hostInfo.'/basiin/tell/'.$this->id.'/';
    }

    /**
     * Called when a new instance is created without packed $data
     */
    protected function _initialize(){
        $this->started = time();
    }

    /**
     * Returns a stClass object with all the important data of the object
     *
     * Used by serializeTransactions to safely encode data for session storage
     * 
     * @return stdClass
     */
    public function package(){
        $result = new stdClass();

        foreach ($this as $key => $value){
            if(is_object($value) && method_exists($value, 'package'))
                $result->$key = $value->package();
            else
                $result->$key = $value;
        }
        
        return $result;
    }

    /**
     * Rebuilds a session saved model that was saved by package()
     *
     * Invoked by __construct if $data available. recreates a previously
     * package()'d object.
     *
     * @param stdClass $data the data jsonencoded by $this->package()
     * @return boolean
     */
    public function unpack($data){
        foreach ($data as $id=>$value){
            if ($id === 'transfers')
                $this->$id = $this->unpackTransfers($value);
            else
                $this->$id = $value;
        }

        return true;
    }

    /**
     *  Unpacks BTransfer objects in $transfers and returns the resulting array
     * @param packedBTransfer[] $transfers
     * @return BTransfer[]
     */
    private function unpackTransfers($transfers){
        $result = array();
        foreach ($transfers as $tag=>$transfer){
            $result[$tag]= new BTransfer($tag,$transfer);
        }
        return $result;
    }
}
?>
