<?php
/**
 * Object that keeps track of a basiin data transfer
 *
 * NOTE: after FEB 12 2012, all transactions and transfers get generated numeric 
 *       ids from the DB (data/basin.db).
 *       
 * after initiating a transfer through:
 *  Basiin/init/transfer/$transactionId/$DataLength/$maxPieceLength
 * to which basiin returns:
 *  js:$transactionId.loader.setuptransfer( transferid, length, pieces )
 *
 * /NOTE
 *
 * @property string $id
 * @property Boolean[] $pieces an array of Boolean
 * @property int $pieceCount DEPRECATED use count($pieces)
 * @property int $pieceSize the length of each transfer piece
 *
 * @author Kiriakos
 */
class BTransfer extends EBasiinActiveRecord {
    /**
     *  Hash generated clientside by init.hash
     * @var string
     */
    protected $id;

    /**
     *  Bool[] of pieces True for recieved pieces
     * @var array
     */
    protected $pieces;


    /**
     *  Create a transfer piece (BPiece) and add it to $this->pieces array
     * @param integer $i
     * @param string $data
     * @return BPiece
     */
    public function createPiece($index,$data){
        $this->pieces[$index] = new BPiece($index, $data);
        return $this->pieces[$index];
    }

    /**
     *
     * @param string $id
     * @param array $data
     */
    public function  __construct($id = NULL,$data = NULL) {

        // this should never happen, BTransfer inits are done with $id
        // these occur on genuine new instantiations
        if ($data === NULL && $id === NULL) 
            $this->id = Basiin::generateTransferId();

        //these occur when unpacjing from session storage
        if($id !==NULL )
            $this->id = $id;
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
