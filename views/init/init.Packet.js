function Packet (url, identity, options)
{
    var _state  = 0;
    var _states = {'pending':0, 'transfering':1, 'completed':2, 'failed':3};
    var _element;
    
    function _pending (){return (_state==_states.pending)}
    function _transfering(){return (_state==_states.transfering)}
    function _completed(){return (_state==_states.completed)}
    function _failed(){return _state == _states.failed} //failed timed out etc..

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
            else //an ask packet
                url.push(_hash(Math.random()).substr(0,2));//2chars,don't want to flood the urlspace

            _state=_states.transfering;
            
            var loadFunc = function(){
                
                var result = window[_params.variable];
                if (_validate(result))
                    _state = _states.completed;
                else
                    _state = _states.failed
            }

            _element = _elements.script( url, loadFunc, failFunc );
                
            return true;
        }

    };
}