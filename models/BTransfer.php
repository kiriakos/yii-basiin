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
class BTransfer extends BasiinActiveRecord {
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

    
}

?>
