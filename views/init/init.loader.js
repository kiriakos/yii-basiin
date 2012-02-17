_loader = {

        /**
         *  Generates a url to the basiin server's domain based on a passed array
         *
         *  recognizes aliases that are properties of _transaction.server
         */
        'createURL' : function(arr){
            var url = _transaction.server.location

            // arr:['route', 'article', 54 ] => str:"/route/article/54"
            for (var i=0; i<arr.length; i++){
                if (arr[i] in _transaction.server)
                    url += '/' +_transaction.server[arr[i]];
                else
                    url += '/' + arr[i]
            }

            return url;
        },

        /**
         *Boolean: check if enough resources exist to communicate with the serv
         */
        'hasBandwidth':function(){
            _log("checking: Bandwidth "+ _elements.active+'<'+
                _transaction.maxElements+ " && "+ _elements.active+ '<'+
                _transaction.maxTransfers );
            return (_elements.active < _transaction.maxElements &&
                _elements.active < _transaction.maxTransfers);
        },

        /**
         * Install a script file
         *
         * the file argument must be an instance of the objects in the
         * _loader.files array
         * TODO: make this a prototype of all objects in files array. This way
         *       install will be file.install() muxch cleaner.
         *
         * returns file
         */
        'install': function(file){
            _log( 'installing: '+file.tag );
            // create a script tag with the route request to the file
            // the script tag gets an onLoad(this.loader.) hook)
            file.element = _elements.script( ["file", file.file], file.onLoad);
            file.status = 'loading';

            return file;
        },
        'confirmInstall': function(tag){//move file called tag obj from loading to loaded
            _log( 'confiming install of: '+tag)

            for (var i=0; i>_loader.files.length;i++){
                if (_loader.files[i].tag == tag){
                    files[i].status = 'installed';
                    _loader.processQueues();
                }
            }
        },
        /**
         * lists of filepaths to files:
         *
         * queued, loaded and currently loading files
         */
        'files': $jsFiles, // [ {name:file}, {}, {}]

        'transfers': [], // Transfer[{Transfer},{Transfer},{},...] (queued, completed and active state in obj)

        /**
         * Get a file from the _loader.files var that has obj attributes
         *  was: getQueuedFile, getQueuedTransfer
         * loops through the cond objects properties for each file in
         * _loader.files if it finds a file where all conditions apply it
         * returns that one.
         *
         * @param type               Files(file) or Transfers(transfer)
         * @param condition          condition object file{tag,file,onLoad,status}
         * @param options            query settings options. valid attributes:
         *                              defined(false):    if true treats undefined attrs as misses instead of hits
         *                              all(false):        if true return all hits
         *
         * @return fileObject
         */
        'getAsset': function( type, condition, options ){
            // fix the plural anomaly if type = "file" instead of "files"
            if( _loader[type]==undefined && _loader[type+'s'] )type = type+'s';

            // overwrite settigns with options
            var settings={'defined':false, 'all':false}; //defaults
            if (options) for (var oattr in options) {settings[oattr] = options[oattr]} //apply options

            // query assets
            var assets = _loader[type];
            var hits=[];
            for (var i=0; i<assets.length; i++){ //loop assets
                var asset = assets[i];
                var isHit = true;

                for (var attr in condition){ //loop conditions
                     isHit = isHit && (
                     (settings.defined == false && asset[attr] == undefined)
                            || asset[attr] == condition[attr]
                            || (typeof asset[attr] == 'function' && asset[attr]() == condition[attr])
                        )
                }

                if (settings.all && isHit) //append hit to array
                    hits.push(asset);
                else if (isHit) //if only the first hit is requested
                    return asset;
            }

            if (hits.length == 0)
                return false;
            else
                return hits;
        },
        'getFile': function(condition, options){return _loader.getAsset('file',condition, options);},
        'getTransfer': function(condition, options){return _loader.getAsset('transfer',condition, options);},

        'processQueues': function(){
            var file = false;
            var transfer = false;

            while( _loader.hasBandwidth() && (file = _loader.getFile({'status':'queued'}))){
                _loader.install(file);
            }
            while( _loader.hasBandwidth() && (transfer = _loader.getTransfer({'status':'queued'}) )){
                transfer.start();
                _log( 'transfering: '+ transfer.tag(), 2);
            }
        },

        'calculatePieceLength': function(url){return 1000 - url.length;},

        /**
         * The transfer object, instantiated ONLY by basiin.transfer(tr)
         *
         * @property string tag     the identifier of the transfer, not ID since you can manually assign
         * @property string data    the data (in string representation) that is to be transfered
         * @property array  pieces  an array of pieces that is data split into sendable chunks
         * @property float progress    the percentage 0-1 the transfer has progressed
         * @method   string status  returns the string version of the Transfers state
         *
         */
        'Transfer': $__Transfer
    };