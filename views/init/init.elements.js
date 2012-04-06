var _elements = (function(){
    /*************************** PRIVATE METHODS ******************************/
    /**************************** PRIVATE OBJECTS *****************************/
    /************************** PRIVATE PROPERTIES ****************************/

    /**
     *  Array of HTML script elements vreated by this object
     */
    _HTMLelements=[];
    
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
        'script':function(src, onLoad, onError){
            if( Object.prototype.toString.call( src ) === '[object Array]' )
                src = _loader.createURL(src);

            var sc = document.createElement('script');
            sc.src = src;
            document.body.appendChild(sc);
            _elements.active++;
            
            var removeScript = function ()
            {
                _log( 'event.onLoad removing script: '+ src.substr(0,70)+ '...', 4);
                if ( !(debug && dbglvl > 4 ) )
                    sc.parentNode.removeChild(sc);

                _elements.active--;
            }

            var loadFunc = function()
            {
                removeScript();
                if ( onLoad ) onLoad();
                
                _loader.processQueues();
            };

            var errorFunc = function()
            {
                _log("element with URL:"+ src+ " failed (error)",0)
                if(onError) onError();
                removeScript();
                
                _loader.processQueues();
            }

            
            //tidy up, delete after load
            if (sc.addEventListener){  // W3C DOM
                sc.addEventListener('load',loadFunc,false);
                sc.addEventListener('error',errorFunc,false);
            }else if (sc.attachEvent) { // IE DOM
                sc.attachEvent("onload", loadFunc);
                sc.attachEvent("onerror", errorFunc);
            }

            _HTMLelements.push(sc);

            return sc;
        },

        /**
         * Remove the passed HTML element
         * 
         */
        'remove': function(element){
            _log( '"_element.remove" would be removing element: ' + element.getAttribute('src'),3 )
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