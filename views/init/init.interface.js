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
                var transfer = new _loader.Transfer(tr)

                return transfer.enqueue();
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

        //tell the server something data, url, tag
        'tell': function(trstub){
            if (!trstub.url) trstub.url = _transaction.server.tell ;
            if (!trstub.tag) trstub.tag = _hash(Math.random());
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
                if(debug) console.log('('+_transaction.id+') ' + 'basiin transaction '+_transaction.id+' initializing,')
                /* init tasks */
                eval('window.'+_transaction.id+' = this'); //put basiin into global namespace
                _loader.processQueues();
                _elements.removeSelf();
                if(debug) console.log('('+_transaction.id+') ' + 'basiin transaction '+_transaction.id+' init completed,')
            }else{
                if(debug) console.log('('+_transaction.id+') ' + 'basiin transaction '+_transaction.id+' already initialized,')
                return false;
            }
            return this;
        },
        'eval': function(str){
            if (debug) return eval(str);
            else return undefined;
        }

    }
})()

