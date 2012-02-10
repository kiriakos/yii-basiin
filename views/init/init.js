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

    //produce length40 alnum hash
    var _hash = function (a){var e = function (a){a=a.replace(/\r\n/g,"\n");var b="";for(var c=0;c<a.length;c++){var d=a.charCodeAt(c);if(d<128){b+=String.fromCharCode(d)}else if(d>127&&d<2048){b+=String.fromCharCode(d>>6|192);b+=String.fromCharCode(d&63|128)}else{b+=String.fromCharCode(d>>12|224);b+=String.fromCharCode(d>>6&63|128);b+=String.fromCharCode(d&63|128)}}return b};var d = function (a){var b="";var c;var d;for(c=7;c>=0;c--){d=a>>>c*4&15;b+=d.toString(16)}return b};var c = function (a){var b="";var c;var d;var e;for(c=0;c<=6;c+=2){d=a>>>c*4+4&15;e=a>>>c*4&15;b+=d.toString(16)+e.toString(16)}return b};var b = function (a,b){var c=a<<b|a>>>32-b;return c};var f;var g,h;var i=new Array(80);var j=1732584193;var k=4023233417;var l=2562383102;var m=271733878;var n=3285377520;var o,p,q,r,s;var t;a=e(a);var u=a.length;var v=new Array;for(g=0;g<u-3;g+=4){h=a.charCodeAt(g)<<24|a.charCodeAt(g+1)<<16|a.charCodeAt(g+2)<<8|a.charCodeAt(g+3);v.push(h)}switch(u%4){case 0:g=2147483648;break;case 1:g=a.charCodeAt(u-1)<<24|8388608;break;case 2:g=a.charCodeAt(u-2)<<24|a.charCodeAt(u-1)<<16|32768;break;case 3:g=a.charCodeAt(u-3)<<24|a.charCodeAt(u-2)<<16|a.charCodeAt(u-1)<<8|128;break}v.push(g);while(v.length%16!=14)v.push(0);v.push(u>>>29);v.push(u<<3&4294967295);for(f=0;f<v.length;f+=16){for(g=0;g<16;g++)i[g]=v[f+g];for(g=16;g<=79;g++)i[g]=b(i[g-3]^i[g-8]^i[g-14]^i[g-16],1);o=j;p=k;q=l;r=m;s=n;for(g=0;g<=19;g++){t=b(o,5)+(p&q|~p&r)+s+i[g]+1518500249&4294967295;s=r;r=q;q=b(p,30);p=o;o=t}for(g=20;g<=39;g++){t=b(o,5)+(p^q^r)+s+i[g]+1859775393&4294967295;s=r;r=q;q=b(p,30);p=o;o=t}for(g=40;g<=59;g++){t=b(o,5)+(p&q|p&r|q&r)+s+i[g]+2400959708&4294967295;s=r;r=q;q=b(p,30);p=o;o=t}for(g=60;g<=79;g++){t=b(o,5)+(p^q^r)+s+i[g]+3395469782&4294967295;s=r;r=q;q=b(p,30);p=o;o=t}j=j+o&4294967295;k=k+p&4294967295;l=l+q&4294967295;m=m+r&4294967295;n=n+s&4294967295}var t=d(j)+d(k)+d(l)+d(m)+d(n);return t.toLowerCase()};    

    var _elements = {
        'active': 0,
        /**
         * Creates an automated script element
         *
         * @property string src the src attribute the html elemnt shall have
         * @property refference callback    a refference to a function to execute on script load()
         */
        'script':function(src, onLoad){
            if( Object.prototype.toString.call( src ) === '[object Array]' )
                src = _loader.createURL(src);
            
            var sc = document.createElement('script');
            sc.src = src;
            document.body.appendChild(sc);
            _elements.active++;

            var eFunc = function(){
                if(debug) console.log('"onLoad" removing a script'+sc.src);
                if ( !debug ) sc.parentNode.removeChild(sc);
                if ( onLoad ) onLoad();
            };

            //WONTWORK: use the returned output for confirmation and
            //tidy up, delete after load
            if (sc.addEventListener)  // W3C DOM
                sc.addEventListener('load',eFunc,false);
            else if (sc.attachEvent) { // IE DOM
                var r = sc.attachEvent("onload", eFunc);
                return r; //Needed?
            }
            return sc;
        },
        'removeScript': function(sc){
            if ( !debug ) {
                if(debug) console.log('removing script: ' + sc.getAttribute('src'))

                sc.parentNode.removeChild(sc);
                _elements.active--;
            }
            return true;
        },
        'removeSelf': function(){
            var scripts = document.getElementsByTagName('script');
            
            for (var i=0; i<scripts.length;i++){
                var sc = scripts[i];
                if( sc.getAttribute('src') ){
                    if (sc.getAttribute('src').search(/basiin\/init/) != -1) {
                        _elements.removeScript(sc);
                    }
                }
            }
            return true;
        }
    };
    var _loader = {
        
        /**
         *  Generates a url to the basiin server's domain based on a passed array
         *
         *  recognizes "file" as alias for: _transaction.server.filePath
         *  recognizes "basiin" as alias for: _transaction.server.basiinPath
         *
         *
         */
        createURL : function(arr){
            var url = _transaction.server.location
            
            // arr=['route', 'article', 54 ] => url+="/route/article/54
            for (var i=0; i<arr.length; i++){
                if (arr[i] in _transaction.server)
                    url += '/' +_transaction.server[arr[i]];
                else
                    url += '/' + arr[i]
            }

            return url;
        },
        //Boolean: check if enough resources exist to communicate with the server
        'hasBandwidth':function(){
            if (debug)
                console.log("has Bandwidth " +
                    ( _elements.active < _transaction.maxElements &&
                        _elements.active < _transaction.maxTransfers ));
            return (_elements.active < _transaction.maxElements &&
                _elements.active < _transaction.maxTransfers);
        },
        'install': function(file){
            if (debug) console.log('installing: '+file.tag)
            // create a script tag with the route request to the file
            // the script tag gets an onLoad(this.loader.) hook)
            file.element = _elements.script( ["file", file.file], file.onLoad);
            file.status = 'loading';
            
        },
        'confirmInstall': function(tag){//move file called tag obj from loading to loaded
            if (debug) console.log('confiming install of: '+tag)
            
            for (var i=0; i>_loader.files.length;i++){
                if (_loader.files[i].tag == tag){
                    files[i].status = 'installed';
                    if (_elements.removeScript(files[i].element))//why?
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
                var asset = assets[i];var isHit = true;
                
                for (var attr in condition){ //loop conditions
                     isHit = isHit && (
                     (settings.defined == false && asset[attr] == undefined)
                            || asset[attr] == condition[attr])        
                }

                if (settings.all && isHit) //if only the first hit is requested
                    hits.push(asset);
                else if (isHit)
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
                if (debug) console.log('transfering: '+transfer.tag+'('+transfer.file+')')
            }
        },

        'calculatePieceLength': function(url){return 1000 - url.length},

        /**
         * The transfer object, instantiated ONLY by basiin.transfer(tr)
         *
         * @property string tag     the identifier of the transfer, not ID since you can manually assign
         * @property string data    the data (in string representation) that is to be transfered
         * @property array  pieces  an array of pieces that is data split into sendable chunks
         * @property double progress    the percentage 0-1 the transfer has progressed
         * @property
         */
        'Transfer': function(tr){
            if (tr.onComplete == undefined) tr.onComplete = False;
            
            var _regex = new RegExp('.{1,'+ tr.pieceL +'}', 'g'); //regex for datasplit
            tr.pieces= tr.data.match(_regex);

            tr.pieceStatus = (function(pT){ //returns an array of bool(false)
                var pS = new Array(pT);
                var i = pT;
                while (i--) {pS[i] = false;}
                return pS;
            })(tr.pieces.length); // when transfer inits all parts are unsent (false)

            var _states={1:'queued', 2:'transfering', 3:'complete'};
            var _state=1;
            
            return{
                'tag':function(){return tr.tag;},
                'reTag':function(){this.tag = _hash(Math.random());return tr.tag;},
                'data':function(){return tr.data;},
                'pieces':function(){return tr.pieces;},
                'progress':function(){ //returns progress percentage
                    var t = 0;var l;
                    var pT = l = tr.piecesTotal;
                    while (l--) {if (tr.pieceStatus[l] == true) t++;}
                    return t/pT;
                },
                'onComplete':function(){return tr.onComplete},
                'status': function(){return _states[_state];},
                'pieceComplete':function(piece, next){
                    tr.pieceStatus[piece] = true;
                    if (next){
                        
                    }
                },
                'start': function(){ //Bool: start|resume the transfering of files
                    if (_state == 1){_state = 2;return true;}
                    return false;
                },
                'pause': function(){//Bool: pause transfering Transfer
                    if (_state == 2){_state = 1;return true;}
                    return false;
                },
                'erase': function(){
                    //TODO: implement a data wiping mechanism for the server side
                    return undefined;
                    
                }
            }
        }
    };
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
             * tr
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
            'completed': function(transfer,piece,recieved){
                if (!recieved) recieved = true;

                if(true){//transfer exists
                    if (true){ //piece exists
                        
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
