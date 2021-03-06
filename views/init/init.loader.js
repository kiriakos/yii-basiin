var _loader = (function(){

    /*************************** PRIVATE METHODS ******************************/

    /**
     *  Generate a url to the basiin server's domain based on a passed array
     *
     *  recognizes aliases that are properties of _transaction.server
     *  arguments are either one array or a plain list of arguments.
     *
     *  @return string
     */
    function _createURL()
    {   var arr

        if(arguments.length === 1) arr=arguments[0]
        else arr = arguments

        var url = _transaction.server.location

        // arr:['route', 'article', 54 ] => str:"/route/article/54"
        for (var i=0; i<arr.length; i++){
            url += '/';
            if (arr[i] in _transaction.server)
                url += _transaction.server[arr[i]];
            else if (arr[i]+'Path' in _transaction.server)
                url += _transaction.server[arr[i]+'Path'];
            else
                url += arr[i]
        }

        return url;
    }

    /**
     *Boolean: check if enough resources exist to communicate with the serv
     */
    function _hasBW()
    {
        _log("checking: Bandwidth "+ _elements.active+'<'+
            _transaction.maxElements+ " && "+ _elements.active+ '<'+
            _transaction.maxTransfers , 5);
        return (_elements.active < _transaction.maxElements &&
            _elements.active < _transaction.maxTransfers);
    }

    /**
     * Install a script file
     *
     * the fileOptions argument must be an instance of the objects in the
     * _loader.files array
     *
     * returns file
     */
    function _install(fileOptions)
    {
        _log( 'installing: '+fileOptions.packageName, 2 );
        // create a script tag with the route request to the file
        // the script tag gets an onLoad(this.loader.) hook)
        var file = new File (fileOptions);
        _assets.files.push(file);
        file.install();
        
        return file;
    }

    /**
     *  Create a transfer from a tr base object
     *  @param tr       Transfer options object
     *  @param encodeData   Tells Transfer.init() not to URLencode data (useful when sending big ascii files like images)
     *  @return integer The index of the transfer
     */
    function _transfer(tr, encodeData)
    {
        var transfer = new Transfer (tr, encodeData);
        _assets.transfers.push( transfer );
        
        return transfer;
    }

    /**
     *  One Packet transfer that ignores available bandwith
     *
     *  options:
     *      onComplete: fired after the script element loads
     *      onError:    fired if the script element fails
     */
    function _ask(url, options)
    {
        var packet = new Packet(url, {index:'question'}, options)
        if (packet.send() === false) return false;

        return packet;
    }

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
    function _getAsset ( type, condition, options )
    {
        // fix the plural anomaly if type = "file" instead of "files"
        if( _assets[type]==undefined && _assets[type+'s'] )
            type = type+'s';
           
        // overwrite settigns with options
        var settings={'defined':false, 'all':false}; //defaults
        if (options) for (var oattr in options) {settings[oattr] = options[oattr]} //apply options

        _log( '_loader.getAssets '+ type+ ':'+ JSON.stringify(condition) , 5);

        // query assets
        var assets = _assets[type];
        var hits=[];
        
        for (var i=0; i<assets.length; i++){ //loop assets
            var asset = assets[i];
            var isHit = true;

            for (var attr in condition){ //loop conditions
                 isHit = isHit && (
                    (settings.defined == false && asset[attr] == undefined)
                        || asset[attr] == condition[attr]
                        || (typeof asset[attr] == 'function' &&
                                asset[attr]() == condition[attr])
                )
            }

            if (settings.all && isHit) //append hit to array
                hits.push(asset);
            else if (isHit) //if only the first hit is requested
                return asset;
        }


        if (hits.length == 0)
        {
            _log ("_loader.getAssets " + type + ': no hits this time.', 5);
            return false;
        }
        else
            return hits;
    }
    function _getFile(condition, options)
    {   return _getAsset('file',condition, options);    }
    function _getTransfer(condition, options)
    {   return _getAsset('transfer',condition, options);    }


    /**
     *  As long as basiin has resources keep starting Files & Transfers
     *
     *  @return undefined
     */
    function _processQueues()
    {
        var file = false;
        var transfer = false;
        _log("processing queues")
        while( _loader.hasBandwidth() && (file = _getFile({'isQueued':true}))){
            file.install();
        }
        while( _loader.hasBandwidth() &&
                ( (transfer  = _getTransfer( {'isTransfering':true, 'hasUnsentPackets':true, 'hasAvailableElements':true} ))  ||
                    (transfer = _getTransfer({'isQueued':true})) ) )
        {
            if (transfer.isQueued())
                transfer.start();
            if (transfer.isTransfering())
                transfer.proceed();
        }
    }
    

    /**************************** PRIVATE OBJECTS *****************************/
    
    $__Packet
    $__Transfer
    $__File

    
    /************************** PRIVATE PROPERTIES ****************************/

    var _assets = {
        /**
         *  The array that holds all the File objects created by _loader (basiin)
         */
        files : [],

        /**
         *  Array that holds all Transfers created by _loader (basiin)
         */
        transfers : []

    };

    
    /******************************** INIT ************************************/

    /**
     * list of File objects to insall uppon _loader.init()
     *
     * this is the loader's refference to the Files it has installed or has set
     * up to be installed
     */
    var _initFiles = $initFiles; // [ {file:fileName, tag:installName}, {}, {} ]
    var _initTransfers = $initTransfers;


    function _init()
    {
        if(_initFiles) 
        {
            for (var i=0; i<_initFiles.length; i++)
                _assets.files.push( new File (_initFiles[i]) );

        }
        if(_initTransfers)
        {
            for(var i=0; i<_initTransfers.length; i++)
                _assets.transfers.push( new Transfer (initTransfers[i]) );
        }

        /* remove the init interface*/
        this.init = function(){return undefined;};
        
        /* init is chained to the self execution so: */
        return this;
    }    
    /****************************** INTERFACE *********************************/
    var _interface = {
        'createURL' : _createURL,
        'hasBandwidth': _hasBW,
        'install': _install,
        'transfer': _transfer,
        'ask': _ask,
        
        'getFile': _getFile,
        'getTransfer': _getTransfer,
        'processQueues': _processQueues,
        
        'init': _init
    }

    /******************************** RETURN **********************************/
    return _interface;
    
})().init();