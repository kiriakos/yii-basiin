function(tr){

    //generate a tag via _hash and assign it to tr.tag
    var _reTag = function (tr){
        tr.tag = _hash(Math.random());
        return tr;
    };

    //generate script packets to send to server
    var _proceedTransfer = function (){
        while (_loader.hasBandwidth() && _getPiece({'pending':true}))
            _sendPiece();
    };

    //dispatch a piece of data to the server
    var _sendPiece = function(){
        if(_state==2){ //while transfer state is in transfering
                
                var piece = _getPiece({'pending':true}); // obj{id,data}

                if (piece)
                    piece.send();
                else
                    return false;

                _log( tr.tag + ' sending piece: ' +piece.index);
                return piece;
            }
            return false;
    };
    //return a piece{index,data} that hasn't been transfered yet
    var _getPiece = function(obj){
        for (index = 0; index< tr.pieces.length; index++){
            var hit = true; var piece = tr.pieces[index];
            for (var i in obj){
                 hit = hit && (piece[i] === obj[i] || piece[i] === undefined ||
                    (typeof piece[i] == 'function' && piece[i]() === obj[i]));
            }
            if (hit) return piece;
        }
        return false;
    };

    //piece prototype:
    var Piece = function (index,data){
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
    
    //Initialize the transfer object with default values + args
    var init = function (tr){
        if (tr.onComplete == undefined) tr.onComplete = false;
        if (!tr.pieceL) tr.pieceL = _loader.calculatePieceLength(tr.url);

        while(_loader.getTransfer({'tag':tr.tag})){
            tr = tr.reTag();
        }
        return tr;
    }
    tr = init(tr);

    //create the pieces array that holds the data packets
    var _regex = new RegExp('.{1,'+ tr.pieceL +'}', 'g'); //regex for datasplit
    tr.data = encodeURIComponent(tr.data);
    tr.pieces= tr.data.match(_regex);

    //translate pieces array into array of Piece objects
    for (var i=0; i<tr.pieces.length;i++){
        tr.pieces[i]= new Piece(i, tr.pieces[i])
    }

    //array of statuses descibing the transfer status of each piece in pieces
    tr.pieceStatus = (function(pT){ 
        var pS = new Array(pT);
        var i = pT;
        while (i--) {pS[i] = false;}
        return pS;
    })(tr.pieces.length);

    //state variable and dictionary
    var _states={0:'stopped', 1:'queued', 2:'transfering', 3:'complete'};
    var _state=0;

    
    /**
     *Public Interface
     */
    return{
        'tag':function(){return tr.tag;},
        'reTag':function(){return _reTag()},
        'data':function(){return tr.data;},
        'pieces':function(){return tr.pieces;},
        'progress':function(){ //returns progress percentage
            var t = 0;var l;
            var pT = l = tr.piecesTotal;
            while (l--) {if (tr.pieceStatus[l] == true) t++;}
            return t/pT;
        },
        'onComplete':function(){return tr.onComplete},
        'status': function(){return _states[_state];},
        'pieceComplete':function(piece, next){
            tr.pieceStatus[piece] = true;
            if (next){
                //TODO: what shoudl next be? a func?
            }
        },

        'start': function(){ //Bool: start|resume the transfering of files
            if (_state == 1){
                _state = 2;
                _proceedTransfer();
                return true;
            }
            return false;
        },
        'pause': function(){//Bool: pause transfering Transfer
            if (_state == 2){_state = 1;return true;}
            return false;
        },
        'erase': function(){
            //TODO: implement a data wiping mechanism for the server side
            return undefined;

        },

        /**
         *Sends a piece of the available pool to the server
         *DEPRECATED?
         */
        'sendPiece': function(){
            return _sendPiece();
        },

        'sentPiece': function(index){
            _log( tr.tag + ' piece '+index+ ' successfully delivered');
            
            if (this.completed()){
                if (tr.onComplete) tr.onComplete(this)
            }
            
        },

        'completed':function(){
            if (_state != 3){
                for (var i=0; i<tr.pieces.length; i++){
                    if (!tr.pieces[i].completed()) return false;
                }
                
                _state=3;
                return true;
            }
            return true;
        },

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
}
