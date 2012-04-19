/**
 * Fetches available actions from the basiin server
 */

var basiinGetAvailableActions = {
    dependencies: [
        //packages that are required for this package to be installed
        //only add top lvl packages here eg
        {
            packageName:'jQuery', //example of non standard package installation
            fileName:'jQuery-1.7.1.min.js',
            onAfterInstall:"event.basiin.x( 'jQuery', event.object.getPackage().noConflict(true));"
        },
        {
            packageName:'GUI', //example of non standard package installation
            fileName:'gui.js'
        }
    ],
    //no payload
    //no extendPackage
    install: function(basiin){
        var $ = basiin.jQuery
        var actions = function(){
            var that = this, _tr = basiin.transaction(), _srv = _tr.server, _b = basiin;
            
            var _state = {
                visible:false,
                loaded:false
            }
            var _events = {
                'onStartDisplay':function(e){_state.visible = true;},
                'onStopDisplay':function(e){_state.visible = false;}
            }

            var _variable = basiin.varHash()
            var _packet = basiin.ask(
            ['basiin','init/actions', _variable],
            {'variable':_variable,
                'onAfterValidate':function(){_state.loaded=true;alert('loaded')},
                'onAfterLoad':function(event){event.basiin.actions.display()}
            })
            
            //interface
            this.display = function(){
                basiin.gui.display(that);
            }
            this.content = function(){
                var html = $('<ul>'), response = _packet.getResult();
                    html.css(
                    'list-style-type', 'none'
                );
                // Packet Error handler
                if (response.success === false) return $('<div>').html(response.output);

                var data = _packet.getResult().data;

                for (var i=0;i<data.length;i++){
                    _createLink(data[i], html);
                }
                return html
            }
            this.uName = 'Actions list widget'
            this.uPhrase = 'Widget of "get available actions"'
            this.event = basiin.addEvents(_events, this)
            
        }

        function _createLink(action, html)
        {
            var aTitle;
            var a = $('<a href="#'+ action.packageName+ '">')

            if(action.packageTitle)
                aTitle = action.packageTitle;
            else if(action.packageDescription)
                aTitle = action.packageDescription;
            else
                aTitle =action.packageName;

            a.html(aTitle);
            if (action.packageTooltip)
                a.attr('title', action.packageTooltip);
            else
                a.attr('title', aTitle);

            var clickFNproto = function(e){
                basiin.loading();
                basiin.install(action);
                e.preventDefault()
            },
                clickFN;
                
            if(action.onClick)
                clickFN = function(e) {
                    if (action.onClick() === true) return clickFNproto();
                    else return false;
                }
            else
                clickFN = clickFNproto;

            a.on('click', clickFN );
            
            var li = $('<li>').html(a);
            html.append(li)
        }
        
        basiin.loading("Fetching available actions from "+ basiin.transaction().server.location)
        
        //extend basiin
        basiin.x('actions', new actions);

        //return value validates that the file installation succeded
        return true;
    }
}


