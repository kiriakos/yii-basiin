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

        while ( _loader.hasBandwidth() && (packet = _getPacket()) )
            packet.send();
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
        if (_state == _states.queued){
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

        return t/all;
    }

    /**
     *  Boolean true if all pieces have been recieved by the server
     */
    function _isCompleted ()
    {
        if (_state == _states.transfering )
        {
            for (var i=0; i<_params.pieces.length; i++){
                if (!_params.pieces[i].completed()) return false;
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

    /**
     * If there is data left to transfer return a Packet instance else false
     */
    function _getPacket ()
    {
        
        if (!_hasUnsentPackets())
            return false;

        //get the next piece from _params.data
        var start = _params.packets.length * _params.packetSize;
        var url  = _params.packetUrl.slice(0);
        url.push( _params.serverSideId, 
                    _params.packets.length,
                    _params.data.substr( start, _params.packetSize )
                );

        //create a new packet with that piece
        var packet = new Packet ( url );
        _params.packets.push(packet); //don't forget this, else all packets will send the same data
        _log('Packets created:'+ _params.packets.length);
        return packet;
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
        return ( _params.packets.length < _params.packetsTotalNeeded);
    }
    
    /**************************** PRIVATE OBJECTS *****************************/

    //piece prototype:
    $__Packet

    /************************** PRIVATE PROPERTIES ****************************/

    //state variable and dictionary
    var _states={'paused':-1, 'created':0, 'announcing':1, 'queued':2,
                    'transfering':3, 'complete':4};

    var _state=_states.created;
    
    var _announced = false; //modified only by announce() and it's load function
    var _params = { //undefined here means things that are not overwritable
                    'tag':null,
                    'serverSideId':undefined, // craeted when the transfer announces itself
                    'variable':undefined,
                    'data':null,
                    'started':null,
                    'idle':null, //last time the transfer was active
                    'packets': undefined,
                    'packetsTotalNeeded':undefined, // total packets needed
                    'packetSize':undefined,
                    'packetUrl': [ 'tell' ]
                    
                    //DEPRECATED
                    /*'packetStatus':undefined  use packet.status instead */
                    /*'dataPointer':undefined  use length of packets array */
                }
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

        //create the pieces array that will hold the data packets after they are created
        if(encodeData !== false) _params.data = encodeURIComponent(_params.data);
        
        var urlLength =  _loader.createURL(_params.packetUrl).length+ 1+ _transaction.idDigits+ 1;
        _params.packetSize = _browser.MaxUrlLength - urlLength;
        _params.packetsTotalNeeded = Math.ceil(_params.data.length / _params.packetSize);
        
        _params.packets= []; // _getPiece pushes to this

        _log('Packet size is '+_params.packetSize+ " characters");
        
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
        'hasUnsentPackets': _hasUnsentPackets
        //DEPRECATED
        //'pieceComplete':_isPieceSent, //why?
    }
    
    /******************************** RETURN **********************************/

    return _interface;
}
