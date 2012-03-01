/**
 * The transfer object, instantiated ONLY by basiin.transfer(options)
 *
 * @property string tag     the identifier of the transfer, not ID since you can manually assign
 * @property string data    the data (in string representation) that is to be transfered
 * @property array  pieces  an array of pieces that is data split into sendable chunks
 * @property float progress    the percentage 0-1 the transfer has progressed
 * @method   string status  returns the string version of the Transfers state
 *
 */
function Transfer (o) // tr = init options object
{
    /*************************** PRIVATE METHODS ******************************/

    /* Controll */

    //generate a tag via _hash and assign it to tr.tag
    function _reTag ()
    {
        _params.tag = _hash(Math.random());
    }

    //generate script packets to send to server
    function _proceedTransfer ()
    {
        while (_loader.hasBandwidth() && _getPiece({'pending':true}))
            _sendPiece();
    }

    //dispatch a piece of data to the server
    function _sendPiece ()
    {
        if(_state==2){ //while transfer state is in transfering
                var piece = _getPiece({'pending':true}); // obj{id,data}

                if (piece) piece.send();
                else return false;

                _log( tr.tag + ' sending piece: ' +piece.index);
                return piece;
        }
        return false;
    }


    /**
     *  Start or resume the transfering of Pieces
     */
    function _start ()
    {
        if (_state == _states.queued){
            _state = _states.transfering;
            _proceedTransfer();
            return true;
        }
        return false;
    }

    /**
     *  Pause the transfering of pieces
     */
    function _pause ()
    {
        if (_state == _states.transfering){_state = _states.paused; return true;}
        return false;
    }




    /* Query */

    function _getProgress(){ //returns progress percentage
        var t = 0;var l;
        var pT = l = _params.pieces.length;
        while (l--) {if (_params.pieceStatus[l] == true) t++;}
        return t/pT;
    }

    function _isCompleted ()
    {
        if (_state != 3){
            for (var i=0; i<tr.pieces.length; i++){
                if (!tr.pieces[i].completed()) return false;
            }

            _state=3;
            return true;
        }
        return true;
    }
    //return a piece{index,data} that hasn't been transfered yet
    function _getPiece (obj)
    {
        for (index = 0; index< tr.pieces.length; index++){
            var hit = true; var piece = tr.pieces[index];
            for (var i in obj){
                 hit = hit && (piece[i] === obj[i] || piece[i] === undefined ||
                    (typeof piece[i] == 'function' && piece[i]() === obj[i]));
            }
            if (hit) return piece;
        }
        return false;
    }

    /**
     *calculates the maximum length a piece's data can have
     *based on the maximum url length a src attribute can have
     *@return integer
     */
    function _calculatePieceLength(){return 1000 - tr.url;}

    


    /**************************** PRIVATE OBJECTS *****************************/

    //piece prototype:
    $__Piece

    /************************** PRIVATE PROPERTIES ****************************/

    //state variable and dictionary
    var _states={ 'queued':1, 'transfering':2, 'complete':3 };
    var _state=0;
    var _params = {'tag':null,'data':null,'started':null,'idle':null}
    var _initialized = false; 
    
    /******************************** INIT ************************************/

    //overwrite the defaults with the base arguments `o'
    for(option in o){_params[option] = o[option]}

    //Initialize the transfer object with default values + args
    if (_params.onComplete == undefined) _params.onComplete = false;
    if (!_params.pieceL) _params.pieceL = _calculatePieceLength();

    while(_loader.getTransfer({'tag':_params.tag})){_reTag();}


    //create the pieces array that holds the data packets
    var _regex = new RegExp('.{1,'+ _params.pieceL +'}', 'g'); //regex for datasplit
    _params.data = encodeURIComponent(_params.data);
    _params.pieces = _params.data.match(_regex);

    //translate pieces array into array of Piece objects
    for (var i=0; i<_params.pieces.length;i++){
        _params.pieces[i]= new Piece(i, _params.pieces[i])
        //TODO: shift to lazy Piece generation this will consume way too much
        //      resources for large transfers
    }

    //array of statuses describing the transfer status of each piece in pieces
    //TODO: why not DEPRECATED? Pieces themselves should have this data
    tr.pieceStatus = (function(pT){
        var pS = new Array(pT);
        var i = pT;
        while (i--) {pS[i] = false;}
        return pS;
    })(tr.pieces.length);

    _initialized = true;
    
    /****************************** INTERFACE *********************************/
    
    var _interface = {
        /* Controll*/
        'reTag': _reTag,
        'start': _start,
        'pause': _pause,
        'erase': undefined,
        'sendPiece': _sendPiece, //DEPRECATED?


        
        /* Query */
        'tag':function(){return _params.tag;},
        'data':function(){return _params.data;},
        'pieces':function(){return _params.pieces;},
        'progress': _getProgress,
        'onComplete':function(){return _params.onComplete},
        'status': function(){return _states[_state];},
        'pieceComplete':function(piece, next){
            tr.pieceStatus[piece] = true;
            if (next){
                //TODO: what shoudl next be? a func?
            }
        },

        

        
        //DEPRECATED, only the pieces themselves need to know of that
        'sentPiece': function(index){
            _log( tr.tag + ' piece '+index+ ' successfully delivered');
            
            if (this.completed()){
                if (tr.onComplete) tr.onComplete(this)
            }
            
        },

        'completed':_isCompleted,

        /**
         * shift
         */
        'enque': function(){
            if (_state == 0){
                _state = 1;
                _loader.transfers.push(this)
                _loader.processQueues();
                _log("Transfer.enque: transfer enqued and awaiting transport")
            }
            return this;
        },

        'init':function(){
            tr.instance = this;
            return this;
        }
    }

    /******************************** RETURN **********************************/

    return _interface;
}
