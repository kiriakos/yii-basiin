/**
 *  options:
 *      onLoad
 *      onError
 */
function Packet (url, identity, options)
{
    function _finalize()
    {
        that.event('beforeLoad');
        _state = _states.completed;
        

        if (options && options.variable &&
                _result && _result.output)
            _log('response output: '+ _result.output, 5)
        that.event('afterLoad');
    }
    
    function _failize()
    {
        that.event('beforeError');

        _state = _states.failed;
        _log('Failing packet '+  that.getPacketName());
        
        if (options && options.variable &&
                _result && _result.output)
            _log('response output: '+ _result.output)

        that.event('afterError');

    }
    
    /**
     * Event hook to run custom packet validation code
     *
     * default return is false
     */
    function _validate(result)
    {
        var event = that.event('beforeValidate');
        if (event === undefined) event = true;

        return event;
    }


    //getters
    this.getPacketName = function ()
    {
        var id = identity;
        if (id)
        {
            if(id.name)
                return id.name
            else if (id.tag)
                return id.tag
            else if (id.index)
                return id.index
        }
        
        return "Nameless Packet"
    }

    this.getResult = function (){return _result;}
    this.getIdentity = function (){return identity;}
    this.getUrl = function(){return url}

    this.uName      = this.getPacketName();
    this.uPhrase    = "Packet: "+ this.getPacketName();
    

    this.fail = _failize;
    this.send = function _send(){
        if ( that.isTransfering() || that.isCompleted() )
            return false;

        that.event('beforeSend');

        if (  that.isFailed() && url[0]=='tell' ) //a transfer packet
            url[4]=_hash(Math.random()).substr(0,2);
        else if ( that.isFailed() && url.push !== undefined )//an array ask packet
            url.push(_hash(Math.random()).substr(0,2));//2chars,don't want to flood the urlspace
        else if ( that.isFailed())
            url+="/"+_hash(Math.random()).substr(0,2);

        _state=_states.transfering;

        var loadFunc = function() //called when the packet arrives and is valid js
        {
            _result = _pickUp(options.variable);
            that.event.add(_result.events, true);

            if ( _result === undefined ||  _validate(_result))
                _finalize();
            else
                _failize();
        }

        var failFunc = function() //called on error (eg: server 500) or js error
        {
            _result = _pickUp(options.variable);

            if(_result) that.addEvents(_result.events, true);
            
            _failize()
        }

        _element = _elements.script( url, loadFunc, failFunc );

        that.event('afterSend');
        return true;
    }
    
    
    this.isPending = function _pending (){return (_state==_states.pending)}
    this.isTransfering = function (){return (_state==_states.transfering)}
    this.isCompleted = function ()
    {
        var result = (_state==_states.completed);
        _log('Packet '+ this.getPacketName()+ ' isCompleted question:'+ result.toString(), 5)
        return result
    }
    
    this.isFailed = function (){return _state == _states.failed} //failed timed out etc..


    this.eval = function(string){
        if (debug)
            return eval(string);

        return false;
    }
    
    /**************************************************************************/
    /******************************** INIT ************************************/
    /**No need to put it in a function call, this is supposed to be exec once**/
    /**************************************************************************/

    var _state  = 0;
    var _states = {'pending':0, 'transfering':1, 'completed':2, 'failed':3};
    var _element;
    var _result;
    var that = this;
    //make sure the options object actually exists
    if (options === undefined) options={};
    //install the events
    this.event = this.addEvents(options);

}
Packet.prototype = new BasiinObjectPrototype ();