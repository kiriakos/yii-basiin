// This is a Basiin script all strings that begin with a dollar sign will be
// replaced with data from the utilized controller

// don't litter namespace //var $transaction__id =
(function(){
    /***************************************************************************
     * Private
     **************************************************************************/
    
    $__hash

    /**
     *Returns a _hash of str which can be used as a javascript variable
     *
     *the returned string always starts with a char of [a-zA-Z]
     *the returned string has length hashlength or hashlength+1
     *the process is consistent (every str value has exactly 1 return value)
     *
     *All publicly accessible variables bassin creates ( element variables,
     *basiin object verifiers )
     *
     *@return string
     */
    function _varHash (str)
    {
        var hash = _hash(str);
        // if hash starts with a number add the first alpha char
        if (hash.match(/^[0-9]/)) hash = hash.match(/[a-zA-Z]/)+hash.match(/.{39}/);

        return hash;
    }

    var basiin = null; //deprecated?
    var debug =  $debug;
    var dbglvl = $debuglvl; //higher == more verbose 0 == invalid 5 == max
    var _initialized = false;
    var _transaction = {
        'id': "$transaction__id" , 'transactions': $transactions,
        'idHash':(function(){return _varHash("$transaction__id")})(),
        'events': $events,

        'server': {
            'location': "$homeDomain",
            'domain': "$homeDomain",
            'basiin': "$basiinPath",
            'file': "$filePath",
            'tell': "$transaction__defaultPath", //where data goes when path not set
            'ack' : "basiin/ack"
        },
        'maxTransfers': $transaction__maxTransfers, // server transfer limit
        'maxElements': $transaction__maxElements, //browser load limit
        'maxTransferElements': $transaction__maxTransferElements, //when atomic writes get sorted out you will be able to increase this beyond 1
        'TransferTTL': $transaction__TransferTTL,
        'TransactionTTL': $transaction__TTL,
        'idDigits': $idDigits
    };
    
    /**
     *  Logs a message to console if debug==true or lvl == 0
     */
    function _log (message,level)
    {
        if (!level) level = 0;

        if( (debug && level <= dbglvl ) || level == 0) {
            console.log('('+ _transaction.idHash +') ' + message);
            return true;
        }
        return false;
    }

    

    //don't run if a basiin session is already existing
    for (var i=0; i<_transaction.transactions.length; i++){
        if (window.hasOwnProperty( _varHash(_transaction.transactions[i]) )){
                /* trimmed: && _transaction.transactions[i] != _transaction.id
                 * even if the trans_id is the same the fw should not load.
                 * the public var is created in init
                 */
                console.log('('+_transaction.id+') ' + 'Basin session is running, hold on');
                return {init:function(){return null}}; // null or an object with init()?
    }}

    /**
     *  Data on the user's browser
     */
    var _browser = {
        MaxUrlLength: 4000,
        benchmark: (function (){
            var _urlSizeNext  = 100;
            var _urlSizeStart    = 100;
            var _urlSizeLast     = 100;
            var _activePacket;
            var _data, _orig='';
            for (var i=0; i<_urlSizeNext; i++)
                _orig+="A";

            _data=_orig;
            
            return function(){
                
                if (_activePacket == undefined || _activePacket.completed())
                    _activePacket = basiin.ask( [ 'ack', _data ], {
                        onLoad:function(){
                            _log('Benchmark: succeded for data size '+ _data.length)
                            _data+=_orig;
                            _urlSizeLast = _urlSizeNext;
                            _urlSizeNext = _data.length;
                            _browser.benchmark();
                        },
                        onError:function(){
                            _log('Benchmark: failed for data size '+ _data.length+
                                    ' last known good transport:'+ _urlSizeLast);
                        }
                    })

                
            }
        })()
    };

    $__BasiinObjectPrototype
    $__loader
    $__elements
    
    /**
     * Extend the basiin object with item accesible through tag
     */
    var _extend = function(tag,item, overwrite)
    {
        if (basiin[tag] === undefined || overwrite) basiin[tag] = item;

        return basiin[tag] === item;
    }

    
    //var _event = _protoEvent;
    
    /**
     *  Returns the value of window[variable], retaining the original variable
     *  if retain is true. Default behavior is to unset the variable from the
     *  window object.
     */
    var _pickUp = function(variable, revert, retain)
    {
        if(revert === undefined) revert = null;

        if(variable === undefined) _log('ERROR: No variable name given! Something went wrong!')

        result = window[variable];
        if(!retain) window[variable] = revert;

        return result;
    }
    /***************************************************************************
     * Public interface
     **************************************************************************/
    return $__interface
})().init();
