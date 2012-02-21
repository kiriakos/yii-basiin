-- the sql db creation file for the piece db of Basiin

-- table piece: (params)
--  id: string PK (hash of TransferId, TransactionId, PieceIndex, microtime)
--  Transaction_id: Int self explanatory
--  Transfer_id:    Int self explanatory
--  Transfer_index: Int the index at which this
--  c_time:         Int (auto?) timestamp on create of piece
--  data:           Text the base64 encoded data that the piece holds

/* 
    cleanup: (sql)
        delete from basiin
     
    disambiguation, 4byte INT means:
     range 0 - 4294967294
    1 row/ms will exhaust it in : 4294967294 / (1000 * 60 * 60 ) = 1193hours 
    1 row/ms = 49 days = 1.5 month
    
    to reseed use table SQLITE_SEQUENCE: (sql)
    update SQLITE_SEQUENCE set `seq` = 0 where `name` = basiin_transction;
    
*/
CREATE TABLE basiin_transaction(
     id INTEGER NOT NULL PRIMARY KEY,
     started INTEGER NOT NULL, /* creation date second */
     timeout INTEGER NOT NULL, /* epoch second on which the trans times out
                                  controlled by __construct and Basiin:: */
     
     
);


/*
    cleanup:
        delete fron basiin_transfer where date_a = php:tine()- Basiin::TransferTimeOutSec
*/
CREATE TABLE basiin_transfer(
     id INTEGER NOT NULL PRIMARY KEY,
     transaction_id INTEGER NOT NULL, /* FK pointing to basiin_transaction.id*/
     date_c INTEGER NOT NULL, /* creation date */
     date_a INTEGER NOT NULL, /* last active date, constant updates, used for cleanup */
     file char(40) NOT NULL
     piece_count INTEGER NOT NULL, /* the quantity of pieces in the transfer */
     piece_size INTEGER NOT NULL /* the (byte) length of each piece */
     pieces TEXT /* a single binary string of data representing each piece's 
                    transfer status (True=1, False=0) */
     FOREIGN KEY (transaction_id) REFERENCES basiin_transaction(id)
     
);



/*

    NOTE: DEPRECATED! 
          FEB 20 2012: this is DEPRECATED basiin uses files as transfer 
                       storage now. 
                       
          FEB 21 2012: BTransfer Data will probaly become some sort of stream
                       object written to incrementally - each recieved piece
                       has it's index(position) and a predetermined string size
                       
   TODO: find a way to do byte metrics with javascript so that utf-8 strings can 
         be transfered 

*/ 
--CREATE TABLE basiin_piece(

--        id          CHAR(40) NOT NULL PRIMARY KEY,
--        transfer_tag CHAR(40) NOT NULL PRIMARY KEY,
--        transaction_id CHAR(40) NOT NULL PRIMARY KEY,
--        data        CHAR(990) NOT NULL,
--        date_c      INT /* php: time() on piece creation */
--);
