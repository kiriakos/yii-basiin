/**
 * Generates the base GUI elements for basiin apps
 *
 * this package provides:
 *      basiin.gui          The controller for the basiinSplash overlay and content
 *      basiin.loading()    Repalces basiin.gui.content with a loading screen
 *      basiin.communicating() Is a notification that tells the user that some
 *                          background communications are in progress
 *
 * basiin.loading is a gui blocking tool
 *      
 */
var GUI = {
    dependencies: [
        //packages that are required for this package to be installed
        //only add top lvl packages here eg
        {
            packageName:'jQuery', //example of non standard package installation
            fileName:'jQuery-1.7.1.min.js',
            onAfterInstall:"event.basiin.x( 'jQuery', event.object.getPackage().noConflict(true));"
        }
    ],

    /**
     *base styles
     *
     *basiin blue:
     *  Hue: 219
     *
     *clickable object border:
     *  Sat:20
     *  Bla:92
     *  #BCCCEB
     *
     */
    
    install: function (basiin){
        var success = true;
        basiin.x('gui', new basiinGuiBase(basiin));
        basiin.x('loading', createBasiinLoading(basiin));

        basiin.loading()

        return success;
    

        function basiinGuiBase (basiin)
        {
            var $ = basiin.jQuery, _activeView, 
                _eGui, _eContainer, _eContent, _eMinimize, _eMaximize,
                _viewBuffer = [], //used by display
                _srv = basiin.transaction().server,
                _styles = [ //applied on basiin.gui.display()
                    {
                        select:'#basiinGui *',
                        map:{color:'white'}
                    },
                    {
                        select:'#basiinGui * a',
                        map:{
                            'color':'white',
                            'text-decoration':'none'
                        }
                    }
                ],
                _events=[ //applied with .on() on _generate() to `div#basiinGui'
                    {
                    select:'a', //selectors are relative to `div#basiinGui''
                    map:{
                        'mouseenter.basiinGuiDefault':function(){
                            event.stopPropagation(); //don't allow event to bubble out of basiin
                            //alert('mEnter');
                            $(this).css({'textDecoration':'underline'});
                            return true;
                        },
                        'mouseleave.basiinGuiDefault':function(){
                            event.stopPropagation(); //don't allow event to bubble out of basiin
                            //alert('mOut');
                            $(this).css({'textDecoration':'none'});
                            return true;
                        }
                    }

                    },
                ];

            function _generate ()
            {
                if (! _eGui )
                {
                    
                    $('#basiinGui').each(function(){
                        if($(this).parent()[0].tagName.toLowerCase() !== 'body')
                            $(this).remove();
                    });
                    
                    if ($('#basiinGui').length > 1){
                        $('#basiinGui').remove();
                    }

                    if ($('#basiinGui').length == 0)
                        $('body').append(
                            '<div id="basiinGui" style="background:url(http://kindstudios.k/images/system/pixels/pixel.black.90.png)"></div>'
                        );
                    
                    _eGui = $('#basiinGui');

                    var maxZ=0;
                    _eGui.siblings().each(function(){
                        if ($(this).css('position') === 'static')
                            $(this).css('position', 'static') //common layering problem of auto

                        var newZ = $(this).css('z-index');
                        if(newZ.toString().toLowerCase() == 'auto')
                            $(this).css('z-index', maxZ)
                        else if (newZ > maxZ)
                            maxZ = newZ;

                        return this;
                    })
                    _eGui.css({
                        'color':'white',
                        'text-align':'center',
                        'font-family':'Helvetica, sans-serif',
                        'font-size':'12px',
                        'z-index': maxZ+1,
                        'position':'fixed',
                        'right':0,'top':0,
                        'height':'100%',
                        'width':'100%'
                    })
                }


                if (! _eContainer ){
                    _eGui.append('<div id="basiinContainer"></div>');
                    _eContainer = $("#basiinGui #basiinContainer")
                    _eContainer.css({
                        'position':'absolute',
                        'width':'100%',
                        'bottom':'5%',
                        'top':'5%',
                        'color':'white',
                        'overflow-y':"auto",
                        'overflow-x':"hidden"
                    })
                }

                if (! _eContent ){
                    _eContent = $('<div id="basiinContent">');
                    _eContainer.append(_eContent);
                }

                if (! _eMinimize){
                    _eMinimize = $('<div id="basiinMinimizeButton">')
                    _eMinimize.css({
                        'position':'absolute',
                        'width':'100%',
                        'textAlign':'center',
                        'bottom':'10px'
                    });
                    _eGui.append(_eMinimize);
                    
                    var eMinImg = $('<img>').attr({
                        'src': _srv.location+ '/'+ _srv.iconPath+ '/basiin.up2.16.png',
                        'alt': 'minimize',
                        'width':'16px'
                        })
                        .one('click.gui', basiin.gui.minimize)
                        .css({'cursor':'pointer'});
                    _eMinimize.append( eMinImg )
                }

                if (! _eMaximize){
                    _eMaximize = $('<div id="basiinMaximizeButton">')
                    _eMaximize.css({
                        'position':'absolute',
                        'left':'10px',
                        'top':'7px',
                        'display':'none'
                    });
                    _eGui.append(_eMaximize);

                    var eMaxImg = $('<img>').attr({
                        'src': _srv.location+ '/'+ _srv.iconPath+ '/basiin.down2.16.png',
                        'alt': 'maximize',
                        'width':'16px'
                    }).css({'cursor':'pointer'})

                    _eMaximize.append( eMaxImg )
                    _eGui.append(_eMaximize);
                }

                //apply effects:
                for(var i=0; i<_events.length; i++)
                    _eGui.on(_events[i].map, _events[i].select, _events[i].data)

            }

            this.show = function()
            {
                if ($('#basiinGui'))
                    return $('#basiinGui').show();

                return false;

            }
            /**
             * create basiin.gui
             */
            this.display = function(newView)
            {
                if (! _eContent) _generate();

                if (newView && newView.content){
                    //if the view has already been displayed remove it from its
                    //previous position (this allows better back and forward nav)
                    var viewIndex
                    if ((viewIndex = $.inArray(newView, _viewBuffer)) !== -1)
                    {
                        _viewBuffer = $.grep(_viewBuffer, function(value) {
                            return value != newView;
                        });
                        
                    }

                    //append the view to display on the top of the view buffer
                    _viewBuffer.push(newView)

                    /**
                     *  Send the display events to the specific objects
                     */
                    if(_activeView && typeof _activeView.event === 'function')
                        _activeView.event('beforeStopDisplay')
                    if(newView && typeof newView.event === 'function')
                        newView.event('beforeStartDisplay')

                    if(newView && typeof newView.style === 'function')
                        _eContent.css(newView.style())
                    
                    _activeView = newView //TODO deprecate active view in favor of _viewBuffer
                    var cont = newView.content()
                    
                    _eContent.html(cont);
                    
                    for(var i=0; i<_styles.length; i++)
                        $(_styles[i].select).css(_styles[i].map)

                    if(_activeView && typeof _activeView.event === 'function')
                        _activeView.event('afterStopDisplay')
                    if(newView && typeof newView.event === 'function')
                        newView.event('afterStartDisplay')

                    return _eContent.show();
                }else{
                    if(_activeView && typeof _activeView.event === 'function')
                        _activeView.event('continueDisplay')
                    return _eContent.show();
                }
            }
            this.hide = function()
            {
                if ($('#basiinGui').length != 0)
                    return $('#basiinGui').hide();

                return false;
            }
            this.minimize = function(){
                _eMinimize.hide();
                _eMaximize.show();
                return _eGui.animate(
                    {height:'25', width:'250', 'border-bottom-left-radius':10},
                    400,
                    function(){_eGui.one('click.gui' , basiin.gui.maximize);}
                );
            }
            this.maximize = function(){
                _eMaximize.hide();
                _eMinimize.show();
                return  _eGui.animate(
                    {height:'100%', width:'100%', 'border-bottom-left-radius':0},
                    400,
                    function(){$("#basiinMinimizeButton img").one("click.gui",basiin.gui.minimize);}
                );
            }

        }
        function createBasiinLoading (basiin)
        {
            var $ = basiin.jQuery;
            var _displaying = false;
            var _loadingMessage = 'communicating';
            var _events = {
                'onAfterStartDisplay':function(e){_displaying = true;},
                'onAfterStopDisplay':function(e){_displaying = false;}
            }

            var loading = function loadingScr(message)
            {
                if(message===false)
                    _hide(message);
                else
                    _display(message);
            }

            function _display (message)
            {
                if (message)
                    _loadingMessage = message

                basiin.gui.display(loading)

            }
            function _hide (message)
            {
                if (message)
                    _loadingMessage = message
                
            }

            var srv = basiin.transaction().server;
            loading.content = function(){
                var html = '<div><div>'+ _loadingMessage+'</div>';
                    html+= '<div><img width="48" src="'+ srv.location+ '/'+
                                    srv.iconPath+ '/basiin.custom.1s.gif" /></div></div>';
                return html
            }
            loading.style = function(){return{
                'position':'relative', 'color':'white'
            }};

            //Progress bar constructor
            loading.progressBar = function progressBar (frame){
                var pBar = $('<div>')
                        .css({
                            'background-color':'green',
                            'position':'absolute',
                            'top':'50%',
                            'margin-top':'3px',
                            'height':'6px'
                        });


                frame.append(pBar);

                this.setProgress = function(cent){
                    pBar.width(cent*frame.width())
                }
            }

            loading.uPhrase='Widget "Loading" (basiin.loading)'
            loading.uName='Loading (view) widget'

            loading.event = basiin.addEvents(_events, loading)

            return loading;
        }
    }
}