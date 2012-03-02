var _elements = (function(){
    /*************************** PRIVATE METHODS ******************************/
    /**************************** PRIVATE OBJECTS *****************************/
    /************************** PRIVATE PROPERTIES ****************************/
    /******************************** INIT ************************************/

    /****************************** INTERFACE *********************************/
    /******************************** RETURN **********************************/
    
    return {
        'active': 0,
        /**
         * Creates an automated script element
         *
         * @property string src the src attribute the html elemnt shall have
         * @property refference callback    a refference to a function to execute on script load()
         */
        'script':function(src, onLoad){
            if( Object.prototype.toString.call( src ) === '[object Array]' )
                src = _loader.createURL(src);

            var sc = document.createElement('script');
            sc.src = src;
            document.body.appendChild(sc);
            _elements.active++;

            var eFunc = function(){
                _log( 'event.onLoad would be removing script: '+sc.src);
                if ( !debug )
                    sc.parentNode.removeChild(sc);

                _elements.active--;
                if ( onLoad ) onLoad();

                //automate the queue processing
                _loader.processQueues();
            };

            
            //tidy up, delete after load
            if (sc.addEventListener)  // W3C DOM
                sc.addEventListener('load',eFunc,false);
            else if (sc.attachEvent) { // IE DOM
                var r = sc.attachEvent("onload", eFunc);
                return r; //Needed?
            }
            return sc;
        },

        /**
         * Remove the passed HTML element
         * 
         */
        'remove': function(element){
            _log( '"_element.remove" would be removing element: ' + element.getAttribute('src'))
            if ( !debug ) {
                element.parentNode.removeChild(element);
                _elements.active--;
            }
            return true;
        },


        'removeSelf': function(){ //NOT deprecated, used by init()
            var scripts = document.getElementsByTagName('script');
            var regex = new RegExp(_transaction.server.basiin+'/init');
            
            for (var i=0; i<scripts.length;i++){
                var sc = scripts[i];
                if( sc.getAttribute('src') ){
                    
                    if ( sc.getAttribute('src').search(regex) != -1 ) {
                        _elements.remove(sc);
                    }
                }
            }
            return true;
        }
    }
})();