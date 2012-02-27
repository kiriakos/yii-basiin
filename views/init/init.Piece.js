function Piece (index,data)
{
    var _index  = index;
    var _data   = data;
    var _state  = 0;
    var _element;
    var _verify = function(){return true;} //TODO: create a data verification mech

    return {
        'data':_data,
        'index':_index,
        'state': function(){return _state},//0=pending,1=active,2=completed
        'pending': function(){return (_state==0)}, //return state
        'transfering': function(){return (_state==1)}, //return state
        'completed': function(){return (_state==2)}, //return state

        //verify a piece was sent successfully
        'complete':function(hash){
            if(_verify(hash))_state=2;
            else _state=0;
            return (_state===2);
        },

        'send':function(){
            _state=1;
            var that = this;
            var loadFunc = function(){
                _log('loadFunc: piece '+that.index+' successfully sent!')
                tr.instance.sentPiece(that.index);
            }

            _element = _elements.script(
                [ 'tell', tr.tag, _index, _data ],
                loadFunc
            );
        }

    };
}