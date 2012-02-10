<?php
/**
 * Object that keeps track of a basiin data transfer
 *
 * @property string $tag
 * @property string[] $pieces
 * @property int $piecesTotal
 * @property int $pieceLength
 *
 * @author Kiriakos
 */
class BTransfer {
    /**
     *
     * @var string
     */
    public $tag;

    /**
     *  Associative array of recieved pieces
     *
     * pieceNo=>pieceNodata
     * 
     * @var array
     */
    public $pieces;


    /**
     *
     * @param string $tag
     * @param array $data
     */
    public function  __construct($tag = NULL,$data = NULL) {

        // these occur on genuine new instantiations
        if ($data === NULL && $tag === NULL) 
            $this->tag = Basiin::generateTransferTag();

        //these occur when unpacjing from session storage
        if($tag !==NULL )
            $this->tag = $tag;
        if($data !== NULL)
            $this->unpack($data);
        
        return true;

    }

    /**
     * Returns a stClass object with all the important data of the object
     *
     * Used by BTransaction->package to safely encode data for session storage
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
     *  Unpacks BTransfer objects stored in $data into $this
     * @param packedBTransfer[] $transfers
     * @return BTransfer[]
     */
    public function unpack($data){
        foreach ($data as $id=>$value){
            $this->id = $value;
        }
        return true;
    }
    
}

?>
