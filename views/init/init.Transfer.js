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
var Transfer = function (o, encodeData)
{
    /**************************************************************************/
    /*************************** PRIVATE METHODS ******************************/
    /**************************************************************************/

    /* Controll */

    //generate a tag via _hash and assign it to _params.tag
    function _reHash (param)
    {
        _params[param] = _varHash(Math.random());
    }

    /**
     *  Tell the server about the transfer and await confirmation
     */
    function _announce ()
    {
        if (_state > _states.announcing)
            return false;
            
        _state = _states.announcing;

        //the new/tell call will return an object with: tranferId
        var onLoad = function(){
            that.event('afterAnnounce');
            return _announceResponse(_pickUp(_params.variable));
        };

        _elements.script(
            ['basiin/new/tell', _transaction.id, _params.variable,
                _params.packetSize, _params.data.length ]
        , onLoad)

        return true;
        
    }

    function _announceResponse (response) // onLoad handler of the announce request
    {
        if (response === undefined) return alert('the announce response\'s variable is undefined')
        else if (response === false) return alert('the new transfer request was denied by the server')

        _params.serverSideId = response.data;
        _announced = true;

        _log('transfer: '+ _params.tag+ " announced associated with server side Id: "+ _params.serverSideId);

        _state = _states.queued;

        return true;
    }

    

    /**
     *  Every time the transfer resumes from idleness
     */
    function _setTimeOut ()
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
    function _stopTimeOut (){clearTimeout(_time_out_object)}

    /**
     *  executes the logic of a Transfer time out
     */
    function _doTimeOut (){

        that.event('timeOut', '(before)');
        _log('Transfer: '+ _params.tag+ " timed out");
        _has_timed_out = true;
        that.event('afterTimeOut');
        
    }

    /**
     *  Do the completion logic
     */
    function _doComplete ()
    {
        that.event('beforeComplete')
        _state = _states.complete;
        _stopTimeOut();
        that.event('Complete', '(after)');
        return true;
    }

    /**
     *  Maker function,Creates a Packet object from unsent data
     *  
     */
    function _getNewPacket ()
    {
        if (that.hasUnsentPackets() == false)
        {
            _log('Transfer has created all the packets, returning false')
            return false;
        }
        else
            _log('Transfer still has unsent packets, generating')
        
        var encode, decode;
        if(encodeData !== false) //if no explicitly set to false on new Transfer
            encode = decode = true;
        else
            encode = decode = false;

        //get the next piece from _params.data
        var url  = _params.packetUrl.slice(0);
        url.push(
            _params.serverSideId, // srvVar transferId
            _params.packets.length, // srvVar packetIndex
            (decode)?1:0, // srvVar decode
            _hash(Math.random()).substr(0,2)
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
            'onAfterSend': function (){ _activeElements++; },
            'onAfterLoad': function () {
                _activeElements--;
                if (that.isCompleted()) _doFinalize()
                
                that.event('afterPacketLoad');
            },
            'onAfterError': function () {
                _activeElements--;
                that.event('afterPacketError')
            },
            'onBeforeValidate': _validateDataPacket
        }
        //create a new packet with that piece
        var packet = new Packet ( url, id , options);
        _params.packets.push(packet); //don't forget this, else all packets will send the same data
        _log('Packets created:'+ _params.packets.length);
        return packet;
        
    }

    /**
     *  validates that the packet was correctly sent to the server
     *
     *  called by Packet.afterLoad
     */
    function _validateDataPacket(event)
    {
        that.event('beforePacketValidate');

        _log('validating recieved packet: '+ event.object.getPacketName());
        var packet = event.object;
        var result = packet.getResult();
        var identity = packet.getIdentity();
        
        //if this isn't the correct obj or the action failed (success = false)
        if (result.packetIndex != identity.index) return false;

        var valid = (result.success !== false)

        //TODO implement a packet hashing & validation scheme between php & js

        if (valid === true)
            _log('Packet.loadFunction: packet '+  packet.getPacketName()+ ' successfully sent!', 3)
        else
            _log("Packet.loadFunction: packet "+  packet.getPacketName()+ " wasn't delivered properly",3)

        that.event('afterPacketValidate');
        return valid;
    }

    function _getFailedPacket ()
    {
        for (var i=0; i<_params.packets.length; i++)
            if (_params.packets[i].isFailed())
                return _params.packets[i];

        return false;
    }

    /**
     * If there is data left to transfer return a Packet instance else false
     */
    function _getPacket()
    {
        if ( !that.hasAvailableElements() || that.hasTimedOut()   )
            return false;

        var packet;
        
        _log('trying existing packets',2);
        if ( (packet = _getFailedPacket()) )
            return packet;

        _log('trying new packet',2);
        if ( (packet = _getNewPacket()) )
            return packet;

        _log('Transfer checking completion',2)
        if (that.isCompleted()) _doFinalize()
            
        return false; //when no packets are availavble
        
    }

    /**
     *  called only by _getPacket after _isCompleted initiate finalize proc
     */
    function _doFinalize (){
        that.event('beforeFinalize');
        _state = _states.finalizing;

        _loader.ask(['basiin', 'transfer', 'finalize', _transaction.id,
            _params.serverSideId, _params.packets.length], {
                'onAfterLoad': _doFinalizeResponse,
                'onAfterError': _doFinalizeResponse,
                'variable': _params.variable
            }
        )
        
    }

    function _doFinalizeResponse (event)
    {
        var result = event.object.getResult();

        if (_state !== _states.finalizing) return
        //something changed while waiting for the response
        
        if (result.success === true)
            _doComplete();

        else if (result.data)
            _failPackets(result.data.packets);

        else
            _restartTransfer();

        that.event('afterFinalize');
    }

    function _failPackets (failed)
    {
        
        for (var i=0; i< failed.length; i++)
            _params.packets[failed[i]].fail();

        _state = _states.transfering;
        
    }

    function _restartTransfer ()
    {
        that.event("Restart" , '(Before)');
        _log('Unimplemented! Transfer '+ _params.tag + ' failed completely. please restart')
    }


    /**************************************************************************/
    /****************************** INTERFACE *********************************/
    /**************************************************************************/

    /* Controlling */
    /**
     *  Start or resume the transfering of Pieces
     */
    this.start = function ()
    {
        if (_state == _states.queued || _state == _states.paused)
        {

            that.event('beforeDeque');
            _state = _states.transfering;
            that.event('afterDeque');

            that.proceed();


            return true;
        }
        return _state;
    }

    /**
     *  Continue the transfer, generate and send script packets to the server
     */
    this.proceed = function ()
    {
        _log('proceeding transfer '+ _params.tag)
        var packet;
        while ( _loader.hasBandwidth() && that.isTransfering() && (packet = _getPacket())  )
            packet.send();

    }

    /**
     *  Pause the transfering of pieces
     */
    this.pause = function ()
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
    this.touch = function ()
    {
        var now = Math.round((new Date()).getTime() / 1000);

        // init
        if ( _params.started==null ) _params.started = now;

        // cycling while Transfer is active
        if (!_has_timed_out) _setTimeOut()

        return !_has_timed_out
    }

    /* Querying */

    /**
     *  Returns the progress percentage as a decimal
     */
    this.getProgress = function (){

        //get optimum progress dataPointer/data.length
        var optimum = _params.dataPointer/_params.data.length

        //calc % of delivered packets
        var completed = 0;var all = _params.packets.length;

        for (var i=0;i<_params.packets.length; i++)
           if (_params.packets[i].isCompleted()) completed++;

        return (all>0)?optimum*completed/all:0;
    }

    /**
     *  Boolean true if all pieces have been recieved by the server
     */
    this.isCompleted = function ()
    {
        _log("Transfer: "+ _params.tag+ " checking for completion")
        if (_state == _states.transfering && that.getProgress() == 1 )
        {
            for (var i=0; i<_params.packets.length; i++)
                if (!_params.packets[i].isCompleted())
                    return false;

            _log("Transfer: "+ _params.tag+ " all packets succesfully sent, verifying with server now")
            return _doComplete();
        }
        else if (_state == _states.complete) return true;

        return false;
    }
    this.isQueued = function (){return _state == _states.queued}
    this.isPaused = function (){return _state == _states.paused}
    this.isTransfering = function (){return _state == _states.transfering}
    this.hasTimedOut = function (){
        return _has_timed_out;
    }

    /**
     *  check if the transfer has packets that haven't been sent to server
     *
     *  checks for:
     *  packets that haven't been created yet.
     *  TODO: packets that have timed out.
     *  TODO: packets that were recieved corupted.
     */
    this.hasUnsentPackets = function ()
    {
        var result = ( _params.dataPointer < _params.data.length );

        if (result == false)
        {
            for (var i=0; i<_params.packets.length; i++)
                if (_params.packets[i].isFailed()){
                    result = true;
                    break;
                }
            
        }

        _log ("datapointer:"+ _params.dataPointer + "< data length:"+
            _params.data.length+ " = "+ result.toString(), 5)
        
        return result;
    }
    
    this.hasAvailableElements = function ()
    {
        var result = (_activeElements < _transaction.maxTransferElements);
        _log ("active:"+ _activeElements+ "< max:"+
            _transaction.maxTransferElements+ " = "+ result.toString(), 5)
        return result;
    }

    this.eval = function(string){
        if (debug)
            return eval(string);

        return false;
    }

    /**************************************************************************/
    /************************** PRIVATE PROPERTIES ****************************/
    /**************************************************************************/
    
    //state dictionary
    var _states={'paused':-1, 'created':0, 'announcing':1, 'queued':2,
                    'transfering':3, 'finalizing':3.5, 'complete':4};


    /* status properies */
    var _state=_states.created;
    var _has_timed_out = false; // is set to true on timeout
    var _time_out_object=null;
    var _announced = false; //modified only by announce() and it's load function
    
    var _self = undefined; //aliased to this on init()
    var _activeElements=0;

    /* self ref */
    var that = this;
    
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
            'onBeforeComplete':null,
            'onAfterComplete':null,
            'onBeforePacketLoad':null,
            'onAfterPacketLoad':null,
            'onBeforePacketError':null,
            'onAfterPacketError':null,
            'onBeforeTimeOut':null, //fired as last procedure of doTimeOut()
            'onAfterTimeOut':null, //fired as last procedure of doTimeOut()
            'onBeforeAnnounce':null, //fired before _announceResponse
            'onAfterAnnounce':null, //fired before _announceResponse
            'onBeforeError':null, //TODO
            'onAfterError':null, //TODO
            'onBeforeDeque':null, //fired when the  transfer changes from queued to transfering, before proceed
            'onAfterDeque':null, //fired when the  transfer changes from queued to transfering, before proceed


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

    /**************************************************************************/
    /******************************** INIT ************************************/
    /**No need to put it in a function call, this is supposed to be exec once**/
    /**************************************************************************/

    
    // overwrite the defaults with the base arguments `o' undefined init value
    // means not settable by options object
    for( var option in o)
    {if (_params[option] !== undefined) _params[option] = o[option]}


    // Initialize the transfer object with default values + args
    if (_params.tag == null)
        _params.tag = _varHash( (new Date()).getTime() );
    if (_params.variable == undefined)
        _params.variable = _varHash( (new Date()).getMilliseconds );

    // make tag & variable unique
    while(_loader.getTransfer({'uName':_params.tag}))
        _reHash('tag');
    while(_loader.getTransfer({'uVar':_params.variable}))
        _reHash('variable');

    // calculate Packet Size
    var urlLength =  _loader.createURL(_params.packetUrl).length+ 1+ _transaction.idDigits+ 1;
    _params.packetSize = _browser.MaxUrlLength - urlLength;

    // approximate the total amount of packets (wild over estimate)
    _params.packetsTotalNeeded = Math.ceil(_params.data.length*3 / _params.packetSize);

    //int keeps track of the position from which the next Packet's data will
    //start. On init it obviously is at the begin of the string (position 0)
    _params.dataPointer = 0;
    _params.packets= []; // _getPiece pushes to this

    _log('Targeted packet size is '+ _params.packetSize+ " characters", 2);
    _log('Targeted packet count is '+ _params.packetsTotalNeeded , 2);

    
    this.uName  = _params.tag;
    this.uVar   = _params.variable;
    this.uPhrase = "Transfer: "+ _params.tag;
    
    //initialize events subsystem
    this.event = this.addEvents(_params);

    this.touch();
    _announce();

    that.event('afterInitialize');

}
Transfer.prototype = new BasiinObjectPrototype ();