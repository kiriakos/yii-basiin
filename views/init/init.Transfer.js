function(tr){
    var _reTag = function (tr){
        tr.tag = _hash(Math.random());
        return tr;
    }
    var getPendingPiece = function(){
        for (index = 0; index< tr.pieces.length; index++){
            if (tr.pieceStatus[index] === false){ 
                tr.pieceStatus[index] = null;
                return {'index':index,'data':tr.pieces[index]};
            }
        }
        return false;
    }
    /**
     *Initialize the transfer object with default values + args
     */
    var init = function (tr){
        if (tr.onComplete == undefined) tr.onComplete = false;
        if (!tr.pieceL) tr.pieceL = _loader.calculatePieceLength(tr.url);

        while(_loader.getTransfer({'tag':tr.tag})){
            tr = tr.reTag();
        }
        return tr;
    }
    tr = init(tr);

    var _regex = new RegExp('.{1,'+ tr.pieceL +'}', 'g'); //regex for datasplit
    tr.pieces= tr.data.match(_regex);

    tr.pieceStatus = (function(pT){ //returns an array of bool(false)
        var pS = new Array(pT);
        var i = pT;
        while (i--) {pS[i] = false;}
        return pS;
    })(tr.pieces.length); // when transfer inits all parts are unsent (false)

    var _states={0:'stopped', 1:'queued', 2:'transfering', 3:'complete'};
    var _state=1;

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

            }
        },

        'start': function(){ //Bool: start|resume the transfering of files
            if (_state == 1){_state = 2;return true;}
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
         */
        'sendPiece': function(){
            if (debug) console.log('('+_transaction.id+') '+ tr.tag + ' sending a piece');
            var piece = getPendingPiece(); // obj{id,data}

            if (piece)
                var url = _loader.createURL([ 'tell', tr.tag, piece.index, piece.data ]);
            else
                return false;

            var that = this;
            var loadFunc = function(){
                that.sentPiece(piece.index);
            }

            _elements.script(url, loadFunc);
            return index;
        },

        'sentPiece': function(index){
            if (debug) console.log('('+_transaction.id+') '+ tr.tag + ' piece '+index+ ' successfully delivered');
            tr.pieceStatus[index] = true;
            if (this.completed()){
                if (tr.onComplete) tr.onComplete(this)
            }
            
        },

        /**
         * shift
         */
        'enqueue': function(){
            if (_state == 0){
                _state = 1;
                _loader.transfers.push(this)
                _loader.processQueues();
            }
            return this;
        }
    }
}
