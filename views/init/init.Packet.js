function Packet (url)
{
    var _state  = 0;
    var _states = {'pending':0, 'transfering':1, 'completed':2};
    var _element;

    function _pending (){return (_state==_states.pending)}
    function _transfering(){return (_state==_states.transfering)}
    function _completed(){return (_state==_states.completed)}

    return {
        'pending': _pending,
        'transfering': _transfering,
        'completed': _completed,

        'send':function(){
            if (!_pending())
                return false;

            _state=_states.transfering;
            
            var loadFunc = function(){
                _log('Packet.loadFunction: packet '+ url[2] +' successfully sent!')
                _state = _states.completed;
            }

            _element = _elements.script( url, loadFunc );
                
            return true;
        }

    };
}