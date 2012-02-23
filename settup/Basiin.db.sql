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
     id INTEGER PRIMARY KEY, /*see http://www.sqlite.org/autoinc.html */
     started INTEGER NOT NULL, /* creation date second */
     timeout INTEGER NOT NULL /* epoch second on which the trans times out
                                  controlled by __construct and Basiin:: */
);
/*  Ascending index for timed out rows ascending means the rows with smallest
    values are put on top, meaning once a live time is encountered the query
    is complete. Same goes for transfers
*/
CREATE INDEX basiin_transaction_timeouts ON basiin_transaction(timeout ASC);


/*
    cleanup:
        delete fron basiin_transfer where date_a = php:tine()- Basiin::TransferTimeOutSec
*/
CREATE TABLE basiin_transfer(
     id INTEGER PRIMARY KEY, /*see http://www.sqlite.org/autoinc.html */
     transaction_id INTEGER NOT NULL, /* FK pointing to basiin_transaction.id*/
     started INTEGER NOT NULL, /* epoch second of the init if the transfer */
     timeout INTEGER NOT NULL, /* epoch second on which the trans times out
                                  controlled by __construct and Basiin:: */
     file CHAR(40) NOT NULL,
     piece_count INTEGER NOT NULL, /* the quantity of pieces in the transfer */
     piece_size INTEGER NOT NULL, /* the (byte) length of each piece */
     variable_name CHAR(40) NOT NULL, /* this string is the name of the variable
                                        that will be returned by the script
                                        tags */
     FOREIGN KEY (transaction_id) REFERENCES basiin_transaction(id) ON DELETE CASCADE
     /* alt syntax:
        transaction_id INTEGER REFERENCES basiin_transaction(id) ON DELETE CASCADE*/
);
CREATE INDEX basiin_transfer_transactions ON basiin_transfer(transaction_id);
CREATE INDEX basiin_transfer_timeouts ON basiin_transfer(timeout ASC);


/*  
    a single table for the transfer pieces bool[], hopefully this will behave
    like a key-value store where values are arbitrary length
*/
CREATE TABLE basiin_pieces(
     transfer_id INTEGER PRIMARY KEY, /* alias of basiin_transfer(id) */
     pieces TEXT, /* a single binary string of data representing each piece's
                    transfer status (True=1, False=0) */
     FOREIGN KEY (transfer_id) REFERENCES basiin_transfer(id) ON DELETE CASCADE
     
);
