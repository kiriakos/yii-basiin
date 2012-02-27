    (function(){
        return{
        'transaction': function(){return _transaction},
        'hash': function(){return _hash()},

        /**
         * Public interface to _loader the facility that handles transfers
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
             * @param tr    A Transfer object. See _loader.Transfer for details
             */
            'transfer':function(tr){
                //instantiate a new _transfer obj and put it inside the transfers array
                _log('loader.transfer: creating Transfer object');
                var transfer = (new _loader.Transfer(tr)).init();

                _log('loader.transfer: enqeueing Transfer object');
                return transfer.enque();
            },

            // tell the basiin loader to install "file" as "tag"
            'install': function(tag,file){
                _loader.install( {'tag':tag,'file':file} );
            },

            //verify file with "tag" was installed
            'confirmInstall': function(tag){//move file called tag obj from loading to loaded
                return _loader.confirmInstall(tag);
            },
            /**
             *  Verify that a piece was recieved correctly
             *  DEPRECATED?
             */
            'completed': function(transfer,piece,validation){
                if( (transfer = _loader.getTransfer({'status':"transfering"})) ){//transfer exists
                    if (transfer){ //piece exists

                    }
                }
            }
        },

        //tell the server something data, url, tag
        'tell': function(trstub){
            _log('tell: creating assets',2)
            if (!trstub.url) trstub.url = _transaction.server.tell ;
            if (!trstub.tag) trstub.tag = _hash(Math.random());
            _log('tell: passing data off to loader.transfer()',2)
            var tr = this.loader.transfer(trstub);
            return tr;
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
                _log('basiin transaction '+_transaction.id+' initializing,')
                /* init tasks */
                eval('window.'+_varHash(_transaction.id)+' = true'); //put basiin into global namespace
                basiin = this;
                if (debug) eval('window.bajiin = this');
                _loader.processQueues();
                _elements.removeSelf();
                _log('basiin transaction '+_transaction.id+' init completed,')
            }else{
                _log('basiin transaction '+_transaction.id+' already initialized,')
                return false;
            }
            return this;
        },
        'eval': function(str){
            if (debug) return eval(str);
            else return undefined;
        },
        'bw': function (){
            return _loader.hasBandwidth();
        },
        'x': function (tag, item){ 
            _extend(tag,item, false);
        }

    }
})()

