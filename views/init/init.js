// This is a Basiin script all strings that begin with a dollar sign will be
// replaced with data from the utilized controller

// don't litter namespace //var $transaction__id =
(function( debug ){
    /***************************************************************************
     * Internal
     **************************************************************************/
    var _initialized = false;
    var _transaction = {
        'id': "$transaction__id" , 'transactions': $transactions,
        'afterInit': "$command", //somethign to execute afer basiin loads
        'timeout': $transaction__ttl,
        'server': {
            'location': "$homeDomain",
            'basiin': "$basiinPath",
            'file': "$filePath",
            'tell': "$transaction__defaultPath" //where data goes when path not set
        },
        'maxTransfers': "$transaction__maxTransfers", // server transfer limit
        'maxElements': "$transaction__maxElements" //browser load limit
    };
    
    
    //don't run if a basiin session is already existing
    for (var i=0; i<_transaction.transactions.length; i++){
        if (window.hasOwnProperty(_transaction.transactions[i]) &&
            _transaction.transactions[i] != _transaction.id){
                alert('Basin session is running, hold on');
                return {init:function(){return null}}; // null or an object with init()?
    }}
    
    var $__hash
    var $__loader
    var $__elements
    
    /***************************************************************************
     * External (interface)
     **************************************************************************/
    return{
        'transaction': function(){return _transaction},
        'hash': function(){return _hash()},
        /**
         * the facility that handles transfers
         */
        'loader':{
            'files':function(){return _loader.files;},
            /**
             * transfer {data} to server using {tag}
             *
             * Basiin is based on the concept that whatever data is supposed to go
             * from the cient to the home server (the one that started the basiin
             * session) is first going to the basiin server reciever. After
             * completion of the transfer you can call some other Basiin command
             * that will use the data simply by getting the data's {tag}
             *
             * @param tr    A Transfer object
             */
            'transfer':function(tr){
                //instantiate a new _transfer obj and put it inside the transfers array
                tr.pieceL = calculatePieceLength(tr.url);
                var transfer = new Transfer(tr, basiin)
                while(transfers.hasOwnProperty(transfer.tag)){
                    transfer.reTag();
                }
                eval("this.transfers."+transfer.tag()+"= "+transfer);
            },
            'install': function(tag,file){_install(tag,file)},
            'confirmInstall': function(tag){//move file called tag obj from loading to loaded
                return _loader.confirmInstall(tag);
            },
            /**
             *  Verify that a piece was recieved correctly
             */
            'completed': function(transfer,piece,validation){
                if( (transfer = _loader.getTransfer({'status':"transfering"})) ){//transfer exists
                    if (transfer){ //piece exists
                        
                    }
                }
            }
        },

        //tell the server something
        'tell': function(data, url, tag){
            if (!url) url = __transaction.tell ;
            if (!tag) tag = this._hash(Math.random());
            var tr = {}
            tr.data = data;
            tr.url = url;
            tr.tag = tag;
            this.sender.startTransfer(tr)
        },
        'install': function(tag, file){ // wrapper of loader.install()
            this.loader.install({'tag':tag, 'file':file})
        },
        'confirmInstall': function(tag){//wrapper of loader.confirmInstall()
            return this.loader.confirmInstall(tag);
        },
        'init': function (){
            if (!_initialized){ // check w init var
                _initialized = true;
                if(debug) console.log('basiin transaction '+_transaction.id+' initializing,')
                /* init tasks */
                eval('window.'+_transaction.id+' = this'); //put basiin into global namespace
                _loader.processQueues();
                _elements.removeSelf();
                if(debug) console.log('basiin transaction '+_transaction.id+' init completed,')
            }else{
                if(debug) console.log('basiin transaction '+_transaction.id+' already initialized,')
                return false;
            }
            return this;
        }

    }
})( $debug ).init();
