<?php
/**
 * A Piece of a BTransfer
 *
 * @author Kiriakos
 */
class BPiece extends BModel{

    protected $index = NULL;
    protected $data = NULL;
    protected $timeCreated = NULL;
    protected $timeOverwritten = NULL;

    public function __construct( $index, $data ){
        
    }

}
?>
