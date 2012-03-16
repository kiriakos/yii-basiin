/**
 * The transfer object, instantiated ONLY by basiin.transfer(options)
 *
 * Upload o.data to the basiin server.
 * Not binary safe (if someone know how to please contact).
 *
 * NOTE: if used with encodeData=(bool)false, o.data has to be ascii text.
 *
 *  Initialize:
 *  object o:           options object
 *  boolean encodeData: if set to false init() will skip URLencoding 
 *
 * @method string tag     the identifier of the transfer, not ID since you can manually assign
 * @method string o.data    the data (in string representation) that is to be transfered
 * @method float progress    the percentage 0-1 the transfer has progressed
 * @method string status  returns the string version of the Transfers state
 *
 */
var Transfer = function (o, encodeData) // tr = init options object
{
return (function(){


    /*************************** PRIVATE METHODS ******************************/

    /* Controll */

    //generate a tag via _hash and assign it to _params.tag
    function _reHash (param)
    {
        _params[param] = _varHash(Math.random());
    }

    //generate script packets to send to server
    function _proceed ()
    {
        var packet;
        while ( _loader.hasBandwidth() && _isTransfering() && (packet = _getPacket())  )
            packet.send();

        _log("Transfer: "+ _params.tag+ " progress: "+ _getProgress());
    }

    /**
     *  Tell the server about the transfer and await confirmation
     */
    function _announce()
    {
        if (_state > _states.announcing)
            return false;
            
        _state = _states.announcing;

        //the new/tell call will return an object with: tranferId
        var onLoad = function(){
            if (_params.onAnnounce) _event(_params.onAnnounce, {'name':'onAnnounce (after)'});
            return _announceResponse(_pickUp(_params.variable));
        };

        _elements.script(
            ['basiin/new/tell', _transaction.id, _params.variable,
                _params.packetSize, _params.data.length ]
        , onLoad)

        return true;
        
    }
    function _announceResponse(response) // onLoad handler of the announce request
    {
        if (response === undefined) return alert('the announce response\'s variable is undefined')
        else if (response === false) return alert('the new transfer request was denied by the server')

        _params.serverSideId = response.transferId;
        _announced = true;

        _log('transfer: '+ _params.tag+ " announced associated with server side Id: "+ _params.serverSideId);

        _state = _states.queued;

        return true;
    }

    /**
     *  Start or resume the transfering of Pieces
     */
    function _start ()
    {
        if (_state == _states.queued || _state == _states.paused)
        {

            _state = _states.transfering;
            if (_params.onDeque) _event(_params.onDeque);
            
            _proceed();

            
            return true;
        }
        return _state;
    }

    /**
     *  Pause the transfering of pieces
     */
    function _pause ()
    {
        if (_state == _states.transfering)
        {
            _log('Transfer: '+ _params.tag+ " pausing", 2 )
            _state = _states.paused;
            return true;
        }
        return false;
    }

    /**
     *  Updates the timeout counter
     */
    function _touch()
    {
        var now = Math.round((new Date()).getTime() / 1000);

        // init
        if ( _params.started==null ) _params.started = now;

        // cycling while Transfer is active
        if (!_has_timed_out) _setTimeOut()

        return !_has_timed_out
    }

    /**
     *  Every time the transfer resumes from idleness
     */
    function _setTimeOut()
    {
        if (!_has_timed_out)
        {
            _params.idle = Math.round((new Date()).getTime() / 1000);
            clearTimeout(_time_out_object)
            _time_out_object = setTimeout( _doTimeOut ,
                                        _transaction.TransferTTL * 1000) //ms
        }
        
        return !_has_timed_out;
    }

    /**
     *  Procedure: when the transfer completes
     */
    function _stopTimeOut(){clearTimeout(_time_out_object)}

    /**
     *  executes the logic of a Transfer time out
     */
    function _doTimeOut(){
        
        _log('Transfer: '+ _params.tag+ " timed out");
        _has_timed_out = true;
        if (_params.onTimeOut) _event(_params.onTimeOut);
        
    }

    /**
     *  Do the completion logic
     */
    function _doComplete()
    {
        _state = _states.complete;
        _stopTimeOut();
       

        if(_params.onComplete) _event(_params.onComplete);

        return true;
    }

    /* Query */

    /**
     *  Returns the progress percentage as a decimal
     */
    function _getProgress(){

        //get optimum progress dataPointer/data.length
        var optimum = _params.dataPointer/_params.data.length
        
        //calc % of delivered packets
        var completed = 0;var all = _params.packets.length;

        for (var i=0;i<_params.packets.length; i++)
           if (_params.packets[i].completed()) completed++;    

        return (all>0)?optimum*completed/all:0;
    }

    /**
     *  Boolean true if all pieces have been recieved by the server
     */
    function _isCompleted ()
    {
        if (_state == _states.transfering )
        {
            for (var i=0; i<_params.packets.length; i++)
                if (!_params.packets[i].completed())
                    return false;

            //
            return _doComplete();
        }
        else if (_state == _states.complete) return true;
        
        return false;
    }
    function _isQueued(){return _state == _states.queued}
    function _isPaused(){return _state == _states.paused}
    function _isTransfering(){return _state == _states.transfering}
    function _hasTimedOut(){
        return _has_timed_out;
    }

    /**
     *  Creates a Packet object from unsent data
     */
    function _getNewPacket()
    {
        if (!_hasUnsentPackets())
            return false;
        
        var encode, decode;
        if(encodeData !== false) encode = decode = true;
        else encode = decode = false;

        //get the next piece from _params.data
        var url  = _params.packetUrl.slice(0);
        url.push(
            _params.serverSideId, // srvVar transferId
            _params.packets.length, // srvVar packetIndex
            _params.dataPointer, // srvVar startChar
            (decode)?1:0, // srvVar decode
            _hash(Math.random()).substr(0,5)
        );

        //generate the pacet's identity object (usefull for dropped packets etc)
        var id = {
            'index': _params.packets.length,
            'dataPointer':_params.dataPointer,
            'encoded':encode
        };

        //get the length of the url now.
        var urlsize=_loader.createURL(url).length + 1; //+1 for the last slash


        //generate the data part of the url
        //be safe, keep the urlsize always a bit smaller than the limit.
        var appended, data;
        appended = data = '';
        while (urlsize < _browser.MaxUrlLength
                && _params.dataPointer < _params.data.length )
        {
            appended= _params.data.substr( _params.dataPointer, 1 );
            if(encode) appended=encodeURIComponent(appended);
            appended=encodeURIComponent(appended);//BECAUSE_OF_APACHE decoding normaly encoded stuff

            data+=appended;

            urlsize+= appended.length;
            _params.dataPointer++ //only proceeding one char per loop
        }
        if (urlsize > _browser.MaxUrlLength)
        {
            data=data.substr(0, data.length - appended.length);
            _params.dataPointer--
        }
        
        url.push(data);

        var options = {
            'variable': _params.variable,
            'onSend': function (){ _activeElements++; },
            'onLoad': function () { 
                _activeElements--;
                if (_params.onLoad) _params.onLoad();
            },
            'onError': function () {
                _activeElements--;
                if (_params.onError) _params.onError();
            }
        }
        //create a new packet with that piece
        var packet = new Packet ( url, id , options);
        _params.packets.push(packet); //don't forget this, else all packets will send the same data
        _log('Packets created:'+ _params.packets.length);
        return packet;
        
    }

    function _getFailedPacket()
    {
        for (var i=0; i<_params.packets.length; i++)
            if (_params.packets[i].failed())
                return _params.packets[i];

        return false;
    }

    /**
     * If there is data left to transfer return a Packet instance else false
     */
    function _getPacket ()
    {
        if ( !_hasAvailableElements() || _hasTimedOut()   )
            return false;

        var packet;
        _log('trying existing packets',1);
        if ( (packet = _getFailedPacket()) )
            return packet;
        _log('trying new packet',1);
        if ( (packet = _getNewPacket()) )
            return packet;

        if (_isCompleted()) _doFinalize()
            

        return false; //when no packets are availavble
        
    }

    /**
     *  called only by _getPacket after _isCompleted initiate finalize proc
     */
    function _doFinalize(){
        _state = _states.finalizing;
        _askServerAllReceived()
        if(_params.onFinalize) _event(_params.onFinalize, {name:'onFinalize (After)'});
    //}
    
    /**
     *
     */
    //function _askServerAllReceived()
    //{
        _loader.ask(['basiin', 'transfer', 'finalize', _transaction.id,
            _params.serverSideId, _params.packets.length], {
                'onLoad': '_failPackets(_result)',
                'onError': _askServerAllReceived()
            }
        )
    }
    function _askServerAllReceivedResponse($result)
    {
        if (result.complete === true)
            _doComplete();

        else if (result.packets && result.packets.length > 0)
            _failPackets(result.packets);

        else
            _restartTransfer();
    }

    function _failPackets(failed)
    {
        
        for (var i=0; i< failed.length; i++)
            _params.packets[i].fail();
        
    }

    function _restartTransfer()
    {
        if(_params.onError) _event(_params.onError, {name:'Transfer finalization error'})
        _log('transfer '+ _params.tag + ' failed completely. please restart')
    }

    function _addEvent (event, fn, force)
    {
        var ev = 'on'+ event.charAt(0).toUpperCase()+ event.substr(1)
        if (_params[ev] === null || force)// event defaults are null
            _params[ev] = fn;

        return _params[ev]
    }

    function _event(fn, event){
        _protoEvent(fn, event, _self);
    }

    /**
     *  check if the transfer has packets that haven't been sent to server
     *
     *  checks for:
     *  packets that haven't been created yet.
     *  TODO: packets that have timed out.
     *  TODO: packets that were recieved corupted.
     */
    function _hasUnsentPackets ()
    {
        return ( _params.dataPointer < _params.data.length-1 );
    }
    function _hasAvailableElements ()
    {
        return (_activeElements < _transaction.maxTransferElements)
    }
    
    //moved Packet to _loader

    /************************** PRIVATE PROPERTIES ****************************/

    //state dictionary
    var _states={'paused':-1, 'created':0, 'announcing':1, 'queued':2,
                    'transfering':3, 'finalizing':3.2, 'complete':4};

    /* status properies */
    var _state=_states.created;
    var _has_timed_out = false; // is set to true on timeout
    var _time_out_object=null;
    var _announced = false; //modified only by announce() and it's load function
    var _countDown = false;
    var _initialized = false;
    var _self = undefined; //aliased to this on init()
    var _activeElements=0;

    /* instance parameters: undefined means param isn't overwritable */
    var _params = {

            /* user defined params */
            /**
             *  a hash representing a unique ID amongst transfers
             */
            'tag':null,            

            'data':null,

            'packetUrl': [ 'tell' ],

            /* event Hooks */
            'onComplete':null,
            'onTimeOut':null, //fired as last procedure of doTimeOut()
            'onAnnounce':null, //fired before _announceResponse
            'onError':null, //TODO
            'onDeque':null, //fired when the  transfer changes from queued to transfering, before proceed


            /* locked params (init generated) */

            /**
             *  created when the transfer announces itself
             *  unique id for the server
             */
            'serverSideId':undefined,

            /**
             *  the hash value on which the array listens for updates
             *  this value is checked every time the an _element loads
             */
            'variable':undefined,

            /**
             * approximate quantity of chars each packet can contain
             * the real packet sizes vary since each proceed call
             * re calcualtes the space needed for the base tell url
             */
            'packetSize':undefined,

            /**
             * approxaimate count of total packets needed to complete
             * the data transfer. The number is based on the 3*length
             * of the data to be sent, so it is correct when all chars
             * are html entities. Should be over in most cases, will be
             * under if the data has many multibyte chars.
             */
            'packetsTotalNeeded':undefined,

            /**
             *  Pointer to an index of the Data string. symbolizes the
             *  next char to be sent.
             */
            'dataPointer':undefined,

            /**
             *  Packets[] created by the transfer. usefull for
             *  validating if all teh data has been sent
             */
            'packets': undefined,

            /**
             *  Epoch second transfer was created
             */
            'started':undefined,


            /**
             * last time the transfer was active.
             */
            'idle':undefined

    }

    /******************************** INIT ************************************/

    function _init()
    {
        if (_initialized) return true;
        
        // overwrite the defaults with the base arguments `o'
        for( var option in o){if (_params[option] !== undefined) _params[option] = o[option]}


        // Initialize the transfer object with default values + args
        if (_params.tag == null) _params.tag = _varHash( (new Date()).getTime() );
        if (_params.variable == undefined) _params.variable = _varHash( (new Date()).getMilliseconds );

        // make tag & variable unique
        while(_loader.getTransfer({'tag':_params.tag})){_reHash('tag');}
        while(_loader.getTransfer({'variable':_params.variable})){_reHash('variable');}

        /* assign protected instance parameters */

        // calculate Packet Size
        var urlLength =  _loader.createURL(_params.packetUrl).length+ 1+ _transaction.idDigits+ 1;
        _params.packetSize = _browser.MaxUrlLength - urlLength;

        // approximate the total amount of packets
        _params.packetsTotalNeeded = Math.ceil(_params.data.length*3 / _params.packetSize);

        //int keeps track of the position from which the next Packet's data will
        //start. On init it obviously is at the begin of the string (position 0)
        _params.dataPointer = 0;
        _params.packets= []; // _getPiece pushes to this

        _log('Targeted packet size is '+ _params.packetSize+ " characters");
        _log('Targeted packet count is '+ _params.packetsTotalNeeded );

        _touch();
        _announce();

        _init = function(){alert('you can\'t run init multiple times!');return false;}

        return true;
    }

    

    /****************************** INTERFACE *********************************/
    
    var _interface = {
        'init': function(){
            _initialized = _init();
            _self = this;
            return this;
        },
        /* Controll*/
        'start': _start,
        'pause': _pause,
        'proceed': _proceed,

        /* Query - read only */
        //base paraqms
        'tag':function(){return _params.tag;},
        'data':function(){return _params.data;},
        'variable':function(){return _params.variable;},
        'serverSideId':function(){return _params.serverSideId;},

        //state checking
        'progress': _getProgress,
        'queued': _isQueued,
        'paused': _isPaused,
        'transfering': _isTransfering,
        'completed': _isCompleted,
        'timedOut': _hasTimedOut,
        'hasUnsentPackets': _hasUnsentPackets,
        'hasAvailableElements': _hasAvailableElements,

        'addEvent': _addEvent
        //DEPRECATED
        //'pieceComplete':_isPieceSent, //why?
    }
    
    if (debug)
    {
        _interface.e = function (string) {return eval(string);}
    }

    /******************************** RETURN **********************************/

    return _interface;
})().init()
}
