/**
 *  options:
 *      onLoad
 *      onError
 */
function Packet (url, identity, options)
{
    var _state  = 0;
    var _states = {'pending':0, 'transfering':1, 'completed':2, 'failed':3};
    var _element;
    var _result;

    //make sure the options object actually exists
    if (options === undefined) options={};

    function _pending (){return (_state==_states.pending)}
    function _transfering(){return (_state==_states.transfering)}
    function _completed(){return (_state==_states.completed)}
    function _failed(){return _state == _states.failed} //failed timed out etc..

    function _finalize()
    {
        _state = _states.completed;
        if (options && options.onLoad) _event(options.onLoad);
    }
    function _failize()
    {
        _state = _states.failed;
        if (options && options.onError) _event(options.onError());
    }
    
    /**
     * makes shure the data was sent correctly otherwise returns false
     *
     * default return is false
     */
    function _validate(result)
    {

        if (result.packetIndex != identity.index ) return false;

        var hash = result.hash;
        var valid = false;
        
        if (hash === true) valid=true;

        //TODO implement a packet hashing & validation scheme between php & js
        if (valid === true)
            _log('Packet.loadFunction: packet '+ identity.index +' successfully sent!')
        else
            _log("Packet.loadFunction: packet "+ identity.index+ " wasn't delivered properly")

        return valid;
    }

    return {
        'getElement':function(){return _element;},
        'getResult':function(){return _result;},
        
        'pending': _pending,
        'transfering': _transfering,
        'completed': _completed,
        'failed':_failed,
        //return a copy of the Pacet's identity object
        'id':function() {return identity.index},

        'send':function(){
            if ( _transfering() || _completed() )
                return false;
            
            if ( _failed() && url[0]=='tell' ) //a transfer packet
                url[5]=_hash(Math.random()).substr(0,5);
            else if (_failed() && url.push !== undefined )//an array ask packet
                url.push(_hash(Math.random()).substr(0,2));//2chars,don't want to flood the urlspace
            else if (_failed())
                url+="/"+_hash(Math.random()).substr(0,2);
            
            _state=_states.transfering;
            
            var loadFunc = function()
            {
                _result = window[options.variable];
                
                if ( _result === undefined ||  _validate(_result))
                    _finalize();
                else
                    _failize();
            }

            var failFunc = function()
            {
                _failize()
            }

            _element = _elements.script( url, loadFunc, failFunc );
                
            return true;
        }

    };
}