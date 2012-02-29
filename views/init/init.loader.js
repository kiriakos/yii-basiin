var _loader = (function(){

    /*************************** PRIVATE METHODS ******************************/

    /**
     *  Generate a url to the basiin server's domain based on a passed array
     *
     *  recognizes aliases that are properties of _transaction.server
     *  @return string
     */
    function _createURL(arr)
    {
            var url = _transaction.server.location

            // arr:['route', 'article', 54 ] => str:"/route/article/54"
            for (var i=0; i<arr.length; i++){
                if (arr[i] in _transaction.server)
                    url += '/' +_transaction.server[arr[i]];
                else
                    url += '/' + arr[i]
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
            _transaction.maxTransfers );
        return (_elements.active < _transaction.maxElements &&
            _elements.active < _transaction.maxTransfers);
    }

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
    function _install(file)
    {
        _log( 'installing: '+file.tag );
        // create a script tag with the route request to the file
        // the script tag gets an onLoad(this.loader.) hook)
        file.element = _elements.script( ["file", file.file], file.onLoad);
        file.status = 'loading';

        return file;
    }

    /**
     * Chane file tag's status to instlled
     *
     * TODO: find out if this should remain as is or become deprecated in favor
     *       of self installation via script.load() event that reffernces the
     *       File object.
     * TODO: define a File object that will be created by _loader
     */
    function _confirmInstall(tag)
    {
        _log( 'confiming install of: '+tag)

        for (var i=0; i>_assets.files.length;i++){
            if (_assets.files[i].tag == tag){
                _assets.files[i].status = 'installed';
                _loader.processQueues();
            }
        }
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

        _log( 'getting '+ type+ ':'+ JSON.stringify(condition) , 4 );

        // query assets
        var assets = _assets[type];
        _log('assets= '+ assets.length,5);
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
        while( _loader.hasBandwidth() && (file = _loader.getFile({'queued':true}))){
            file.install();
        }
        while( _loader.hasBandwidth() && (transfer = _loader.getTransfer({'status':'queued'}) )){
            transfer.start();
            _log( 'transfering: '+ transfer.tag(), 2);
        }
    }
    

    /**************************** PRIVATE OBJECTS *****************************/

    $__Transfer
    $__File //TODO create File object

    
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
        this.init = undefined;
        
        /* init is chained to the self execution so: */
        return this;
    }    
    /****************************** INTERFACE *********************************/
    var _interface = {
        'createURL' : _createURL,
        'hasBandwidth': _hasBW,
        'install': _install,
        'confirmInstall': _confirmInstall,
        'getFile': _getFile,
        'getTransfer': _getTransfer,
        'processQueues': _processQueues,
        
        'init': _init

        //DEPRECATED: these shouldn't be used any more.
        //'files': _files, //getFile & getTransfer should access the private properties instead
        //'transfers': _transfers
}

    /******************************** RETURN **********************************/
    return _interface;
    
})().init();