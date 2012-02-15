_elements = {
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
                if(debug) console.log('"onLoad" removing a script'+sc.src);
                if ( debug ) sc.parentNode.removeChild(sc);
                if ( onLoad ) onLoad();
            };

            //WONTWORK: use the returned output for confirmation and
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
         * Remove the HTML element of a loaded script
         */
        'removeScript': function(sc){
            if ( !debug ) {
                if(debug) console.log('removing script: ' + sc.getAttribute('src'))

                sc.parentNode.removeChild(sc);
                _elements.active--;
            }
            return true;
        },


        'removeSelf': function(){ //deprecated?
            var scripts = document.getElementsByTagName('script');

            for (var i=0; i<scripts.length;i++){
                var sc = scripts[i];
                if( sc.getAttribute('src') ){
                    if (sc.getAttribute('src').search(/basiin\/init/) != -1) {
                        _elements.removeScript(sc);
                    }
                }
            }
            return true;
        }
    };