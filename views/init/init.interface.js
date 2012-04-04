(function(){

    var intrfc={};

    /***************************** query methods ******************************/
    
    intrfc.initialized= function(){return _initialized};
    intrfc.transaction= function(){return _transaction};


    /**
     *  Hasshing functions can be useful for the developer
     */
    intrfc.hash= _hash;
    intrfc.varHash = _varHash;

    /******************************* actions **********************************/

    //ask the server something. Creates a single script element & Packet.
    //overrides 
    intrfc.ask= function(url, options)
    {
        return _loader.ask(url, options);
    };

    //send the server some data that can be used with some other request
    intrfc.tell= function(data, options)
    {
        _log('tell: creating assets',2)

        _log('tell: passing data off to loader.transfer()',2)
        var tranfer = this.loader.transfer({'data': data});
        return tranfer;
    };

    // wrapper of loader.install()
    intrfc.install= function()
    {
        var map = {};
        //take care of map submission
        if(arguments.length==1){
            map=arguments[0];
            if(map.tag && !map.packageName) map.packageName=map.tag;
            if(map.file && !map.fileName)map.fileName=map.file;
        }else{
            map.packageName = arguments[0]
            map.fileName = arguments[1]
        }

        return _loader.install( map );
    };

    /**
     * Initialize the framework and touchdown @ bajiin if in debug mode
     */
    intrfc.init= function ()
    {
        if (!_initialized){ // check w init var
            _initialized = true;
            _log('basiin transaction '+_transaction.id+' initializing,')
            /* init tasks */
            eval('window.'+_varHash(_transaction.id)+' = true'); //put basiin into global namespace
            basiin = this;
            if (debug) eval('window.bajiin = this');

            _loader.processQueues();
            _elements.removeSelf();
            if(typeof _transaction.events.onAfterInit === 'function')
                _transaction.events.onAfterInit();
            _log('basiin transaction '+_transaction.id+' init completed,')

        }else{
            _log('basiin transaction '+_transaction.id+' already initialized,')
            return this;
        }
        return this;
    };

    /**
     *  Extender
     */
    intrfc.x= _extend;

    /**
     *  Events subsystems
     */
    intrfc.addEvents = (new BasiinObjectPrototype).addEvents;

    /**
     *  URL generator
     */
    intrfc.createURL = _loader.createURL;

    intrfc.uPhrase ="Basiin root interface"
    intrfc.uName ="Basiin"

    /********************************** debug *********************************/
    
    if (debug)
    {
        /**
         * DEPRECAETD:
         * Public interface to _loader the facility that handles transfers
         */
        intrfc.loader= {
            /**
             * transfer {tr.data} to server using {tr.tag}
             *
             * Basiin is based on the concept that whatever data is supposed to go
             * from the client to the home server (the one that started the basiin
             * session) is first going to the basiin server reciever. After
             * completion of the transfer you can call some other Basiin command
             * that will use the data simply by getting the data's {tag}
             *
             * @param tr    A Transfer object. See _loader.Transfer for details
             */
            'transfer':function(tr){
                //instantiate a new _transfer obj and put it inside the transfers array
                _log('loader.transfer: creating Transfer object');
                var tranfer = _loader.transfer(tr);
                return tranfer;
            },

            // tell the basiin loader to install "file" as "tag"
            'install': function(tag,file){
                _loader.install( {'tag':tag,'file':file} );
            },

            //verify file with "tag" was installed
            //DEPRECATED!
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
        };
        intrfc.eval= function(str){
            if (debug) return eval(str);
            else return undefined;
        };
        intrfc.bw= function (){
            return _loader.hasBandwidth();
        };

    }
    
    /********************************* result *********************************/
    return intrfc;
})()

