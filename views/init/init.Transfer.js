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
function Transfer (o, encodeData) // tr = init options object
{
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
        while ( _loader.hasBandwidth() && (packet = _getPacket()) )
            packet.send();

        _log("transfer: "+ _params.tag+ " progress: "+ _getProgress());
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
            return _announceResponse(window[_params.variable])
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
        _anounced = true;

        _log('transfer: '+ _params.tag+ " announced associated with server side Id: "+ _params.serverSideId);

        _state = _states.queued;

        return true;
    }

    /**
     *  Start or resume the transfering of Pieces
     */
    function _start ()
    {
        if (_state == _states.queued)
        {
            _state = _states.transfering;
            _proceed();
            return true;
        }
        return false;
    }

    /**
     *  Pause the transfering of pieces
     */
    function _pause ()
    {
        if (_state == _states.transfering){_state = _states.paused;return true;}
        return false;
    }




    /* Query */

    /**
     *  Returns the progress percentage as a decimal
     */
    function _getProgress(){ 
        var completed = 0;var all = _params.packetsTotalNeeded;
        
        for (var i=0;i<_params.packets.length; i++) 
           if (_params.packets[i].completed()) completed++;    

        return completed/all;
    }

    /**
     *  Boolean true if all pieces have been recieved by the server
     */
    function _isCompleted ()
    {
        if (_state == _states.transfering )
        {
            for (var i=0; i<_params.packets.length; i++){
                if (!_params.packets[i].completed()) return false;
            }

            _state = _states.complete;
            return true;
        }
        else if (_state == _states.complete) return true;
        
        return false;
    }
    function _isQueued(){return _state == _states.queued}
    function _isPaused(){return _state == _states.paused}
    function _isTransfering(){return _state == _states.transfering}
    function _isTimedOut(){
        return _has_timed_out
    }
    function _setTimeOut(){ //every time the transfer resumes from idleness
        
    }
    function _stopTimeOut(){ //when the transfer completes

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
        var data='';
        while (urlsize < _browser.MaxUrlLength-2
                && _params.dataPointer < _params.data.length )
        {
            var appended= _params.data.substr( _params.dataPointer, 1 );
            if(encode) appended=encodeURIComponent(appended);

            data+=appended;

            urlsize+= appended.length;
            _params.dataPointer++ //only proceeding one char per loop
        }
        url.push(data);


        //create a new packet with that piece
        packet = new Packet ( url, id );
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

        var packet;

        if ( (packet = _getFailedPacket()) )
            return packet;

        if ( (packet = _getNewPacket()) )
            return packet;

        return false; //when no packets are availavble
        
        //TODO: this could be a good spot to invoke completion testing

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
    
    /**************************** PRIVATE OBJECTS *****************************/

    //packet prototype:
    $__Packet

    /************************** PRIVATE PROPERTIES ****************************/

    //state variable and dictionary
    var _states={'paused':-1, 'created':0, 'announcing':1, 'queued':2,
                    'transfering':3, 'complete':4};

    
    var _state=_states.created;
    var _has_timed_out = false; // is set to true on timeout
    var _announced = false; //modified only by announce() and it's load function
    
    var _params = { //undefined here means things that are not overwritable

                    /**
                     *  a hash representing a unique ID amongst transfers
                     */
                    'tag':null,
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

                    'data':null,

                    /**
                     *  Pointer to an index of the Data string. symbolizes the
                     *  next char to be sent.
                     */
                    'dataPointer':undefined,

                    /**
                     *  Epoch second transfer was created
                     *  TODO: implement
                     */
                    'started':null,

                    /**
                     * last time the transfer was active.
                     * TODO: implement
                     */
                    'idle':null, 

                    /**
                     *  Packets[] created by the transfer. usefull for
                     *  validating if all teh data has been sent
                     */
                    'packets': undefined,

                    /**
                     * approxaimate count of total packets needed to complete
                     * the data transfer. The number is based on the 3*length
                     * of the data to be sent, so it is correct when all chars
                     * are html entities. Should be over in most cases, will be
                     * under if the data has many multibyte chars.
                     */
                    'packetsTotalNeeded':undefined,

                    /**
                     * approximate quantity of chars each packet can contain
                     * the real packet sizes vary since each proceed call
                     * re calcualtes the space needed for the base tell url
                     */
                    'packetSize':undefined,
                    'packetUrl': [ 'tell' ],
                    
                    /**
                     * available event Hooks 
                     */
                    'onComplete':null,
                    'onTimeout':null

                }
    var _countDown = false;
    var _initialized = false; 
    
    /******************************** INIT ************************************/

    function _init()
    {
        if (_initialized) return true;
        
        //overwrite the defaults with the base arguments `o'
        for(option in o){if (_params[option] !== undefined) _params[option] = o[option]}

        //Initialize the transfer object with default values + args
        if (_params.tag == null) _params.tag = _varHash( (new Date()).getTime() );
        if (_params.variable == undefined) _params.variable = _varHash( (new Date()).getMilliseconds );

        while(_loader.getTransfer({'tag':_params.tag})){_reHash('tag');}
        while(_loader.getTransfer({'variable':_params.variable})){_reHash('variable');}

        //deprectaed data is encoded @ _getPacket
        //create the pieces array that will hold the data packets after they are created
        //if(encodeData !== false) _params.data = encodeURIComponent(_params.data);
        
        var urlLength =  _loader.createURL(_params.packetUrl).length+ 1+ _transaction.idDigits+ 1;
        _params.packetSize = _browser.MaxUrlLength - urlLength;

        //approximation of the total amount of packets
        _params.packetsTotalNeeded = Math.ceil(_params.data.length*3 / _params.packetSize);

        //int keeps track of the position from which the next Packet's data will
        //start. On init it obviously is at the begin of the string (position 0)
        _params.dataPointer = 0;

        _params.packets= []; // _getPiece pushes to this

        _log('Targeted packet size is '+_params.packetSize+ " characters");
        _log('Targeted packet count is '+_params.packetsTotalNeeded);
        
        _announce();
        
        return true;
    }
    _initialized = _init()

    

    /****************************** INTERFACE *********************************/
    
    var _interface = {
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
        'timedOut': _isTimedOut,
        'hasUnsentPackets': _hasUnsentPackets
        //DEPRECATED
        //'pieceComplete':_isPieceSent, //why?
    }
    
    /******************************** RETURN **********************************/

    return _interface;
}
