(function(basiin){
    var a = {
        /**
         * lists of filepaths to files: 
         *
         * queued, loaded and currently loading files
         */
        'files':{ 
            'queue': $jsFiles,
            'loaded': {},
            'loading': {}
        },
        'transfers': null, // array of transfers (completed and active)
        
        /**
         * transfer {data} to server using {tag}
         * 
         * Basiin is based on the concept that whatever data is supposed to go 
         * from the cient to the home server (the one that started the basiin 
         * session) is first going to the basiin server reciever. After 
         * completion of the transfer you can call some other Basiin command
         * that will use the data simply by getting the data's {tag}
         */
        'startTransfer':function(data, tag){
            //instantiate a new _transfer obj and put it inside the transfers array
            var tr = new _transfer()
        },
        
        /**
         * The transfer object, instantiated ONLY by basiin.startTransfer(d,t)
         */
        '_transfer':function(_data, _tag, _pieceLength){
            var _regex = new RegExp('.{1,'+ _pieceLength +'}', 'g'); //regex for datasplit
            var _pieces= _data.match(_regex);
            var _piecesTotal= _pieces.length;
            
            var _pieceStatus = (function(pT){ //returns an array of bool(false) 
                var pS = new Array(pT);
                var i = pT;
                while (i--) {pS[i] = false;}
                return pS;
            })(_piecesTotal);// when transfer inits all parts are unsent (false)


            return{
                'tag':function(){return _tag;},
                'data':function(){return _data;},
                'pieces':function(){return _pieces;},
                'piecesTotal':function(){return _piecesTotal;},
                'progress':function(){ //returns percentage
                    var t = 0;
                    var pT = l = _piecesTotal;
                    while (l--) { if (_pieceStatus[l] == true) t++;}
                    return t/pT;
                },
                
                'start': function(){},
                'pause': function(){},
                'erase': function(){} //TODO: implement a data wiping mechanism for the server side
            }
        }
    }    
    basiin.loader = {
    }    
})( $transaction__id ),

