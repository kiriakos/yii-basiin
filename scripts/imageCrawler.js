var imageCrawler = {
    payload: function imageDiscoveryService(basiin){
        /****************************** Pre Init ******************************/
        //duck punch jQuery until it complies
        (function($){

            var _old = $.unique;

            $.unique = function(arr){

                // do the default behavior only if we got an array of elements
                if (arr[0] && !!arr[0].nodeType){ // (arr[0] && provisions for empty arr pass
                    return _old.apply(this,arguments);
                } else {
                    // reduce the array to contain no dupes via grep/inArray
                    return $.grep(arr,function(v,k){
                        return $.inArray(v,arr) === k;
                    });
                }
            };
        })(basiin.jQuery);
        //end duck punching

        var $ = basiin.jQuery
        var _imHtml = $('<div>').attr({id:'imageContainer'})
        var _images = [], // String[] urls
            _frames = [], // Element[] frame divs of imgs
            _state = {
                visible:false,
                initialized:false
            },
            _events = {
                'onAfterStartDisplay':function(e){_state.visible = true;},
                'onAfterStopDisplay':function(e){_state.visible = false;}
            },
            that = this;
        var _locInfo = new LocationInfo();
        
        /************************ Public Functions ****************************/

        this.content = function(){
            
            _scrapeImages();
            _orderImages();
            
            return _imHtml; //returns the container div where images are being
                            //appended to
        }

        this.display = function()
        {
            basiin.gui.display(that)
        }

        /************************* Private Functions **************************/
        function _scrapeImages()
        {
            //console.log('generating Image elements')
            
            //get all img elems
            var els = $('img');
            //console.log('els.length: '+els.length)
            //console.log('from img tags')
            for(var i=0;i<els.length;i++)
                _createIfUnique($(els[i]).attr('src'));

            //console.log('from elem backs')
            //get all background-image that mention a url(? right?)
            _checkElemForImageInStyles( $('div')) ;
            _checkElemForImageInStyles( $('span')) ;
            _checkElemForImageInStyles( $('a')) ;
            _checkElemForImageInStyles( $('li')) ;

            // create and append Image objs to _images for each image found
            // but only if it doesn't already exist

        }
        
        function _createIfUnique(source)
        {
            if( _isUnique( source ))
                _frames.push(new ImageFrame( source ));
        }

        //Validates the uniqueness of submitted source and appends it _images if true
        function _isUnique(source)
        {
            if(source == undefined) return false;
            
            for (var i=0; i<_images.length; i++)
                if ( _images[i] == source)
                    return false;

            _images.push(source); //append source to images
            return true;
        }

        function _checkElemForImageInStyles(els)
        {
            for(var i=0;i<els.length;i++)
            {
                var url = $(els[i]).css('backgroundImage');
                if(url != 'none' && url !='' && url != false)
                    try{
                        _createIfUnique(url.match(/url\((.*)\)/i)[1]);
                    }catch (e){
                        console.log("Failed image extraction from background style. url given: "+ url);
                        console.log(e);
                    }
                
            }

        }

        function ImageFrame(source) //imageObj
        {
            //Base elements
            var img = new Image,
                $img = $(img),
                name = $('<span>'),
                stat = $('<span>'),
                frame = $('<div>')
                    .append(name)
                    .append(stat)
                    .append($img),
                frameProgressBar = new basiin.loading.progressBar (frame);
            //image characteristics
            var trueW, trueH, aspect, transfer, metaTransfer,
                tr = basiin.transaction(),
                srv = basiin.transaction().server;
            //base attribs & settings
            img.src = source;
            frame.css({
                    'max-width':'256px',
                    'max-height':'256px',
                    'min-width':'256px',
                    'min-height':'256px',
                    'width':'256px',
                    'height':'256px',
                    'overflow':'hidden',
                    'position':'relative',
                    'border-radius':'3px',
                    'margin':'10px',
                    'border-color':'#BCCCEB',
                    'border':'2px',
                    'border-style':'solid',
                    'padding':'5px',
                    'float':'left',
                    'text-shadow':"0 0 2px black",
                    'display':'inline-block'
                })
                .on({
                    'mouseenter':function(){name.slideDown(200);stat.slideDown(200)},
                    'mouseleave':function(){name.slideUp(200);stat.slideUp(200)}
                });
            stat.html('loading image status hold on...')
                .css({
                    'display':'none',
                    'position':'absolute',
                    'left':0,
                    'top':10
                });
            name.html( $img.attr('src').match(/[^\/]+$/).toString().substr(-48, 48) )
                .css({
                    'display':'none',
                    'position':'absolute',
                    'left':0,
                    'top':0
                });

            //LOWER
            $img.one('load', function ()
            {
                trueW = img.width,
                trueH = img.height,
                aspect= trueW/trueH;
                stat.html( img.width+ 'x'+ img.height );
                    
                (aspect > 1)?
                    $img.css('width', 256):$img.css('height', 256);

                //calc height because js won't do it here:
                var h = (trueW != 0 && aspect > 1)?
                        $img.width() * trueH/trueW:256;
                    
                $img.css('margin-top', (256 - h)/2);
                
                frame.css({
                        'cursor':'pointer'
                    })
                    .one({
                        'click': function () {
                            if( _isProxiedTransaction() ){
                                _doImageUpload();
                            }else{
                                _doMetaDataUpload();
                            }
                            frame.css({'cursor':''});
                        }
                    });

                //hide if is icon
                if ( (trueW <= 128 && trueW !=0) && (trueH <= 128 && trueH != 0))
                    frame.addClass('isIcon').hide(200);//css('display','none');
                
                

            });

            //procedure
            //TODO make it a returning functionthat takes `frame' as arg?
            // No, it works just fine like this?
            function _doImageUpload(){
                var dataUrl = _getDataUrl($img),
                    metaTransferId = (function(){
                        if(metaTransfer && metaTransfer.getServerSideId())
                            return metaTransfer.getServerSideId();
                        else if(_locInfo.argumenta.metadata)
                            return _locInfo.argumenta.metadata;
                        else
                            return 'null';
                    })()
                    transfer = basiin.tell(dataUrl);

                transfer.event.add({
                    'onAfterFinalize':function(event){
                        frameProgressBar.setProgress(0);
                        window.location = srv.location
                            +'/'+ srv.basiin
                            +'/image/uploaded/'+ basiin.transaction().id
                            +'/'+ transfer.getServerSideId()
                            +'/'+ metaTransferId
                    },
                    'onAfterPacketLoad':function(event){
                        frameProgressBar.setProgress(
                                        event.object.getProgress());
                    }
                });
            }
            
            function _doImageProxy()
            {
                alert("You will be redireceted to the image now.\n\
                       Please start Basiin again once the next page loads"
                        .replace(/[\t ]+/g,' ').replace(/\n /g, '\n'));
                var dest= new Url(img.src);
                dest.param('isBasiinProxy', basiin.hash(tr.id))
                dest.param('metadata', metaTransfer.getServerSideId() );
                window.location= dest.src();
            }

            function _doMetaDataUpload(){
                
                var data = {
                        "dlOnly":false, //if true the upload will just serve as a proxy to force a save diaplogue
                        "title": _locInfo.title, //.replace(/"/g, ' '), //$("title").html().match(/[^\s]{3,}/g)+' - '+
                        'description':_locInfo.description,
                        'filename':img.src.match(/[^\/]+(:?)?$/)[0],
                        'tags': _getTags($img),
                        'flashRewindUrl':_locInfo.url,
                        'flashRewindTitle':_locInfo.title //.replace(/"/g, ' ')
                    };
                metaTransfer = basiin.tell(JSON.stringify(data));
                metaTransfer.event.add({
                    'onAfterFinalize':function(event){
                        frameProgressBar.setProgress(0);
                        if( _isLocalImage($img))
                            _doImageUpload();
                        else
                            _doImageProxy();
                    },
                    'onAfterPacketLoad':function(event){
                        frameProgressBar.setProgress(
                                        event.object.getProgress());
                    }
                });
            }

            
            function _isProxiedTransaction(){
                var trhash =_locInfo.argumenta.isBasiinProxy;
                if (trhash){ //check if trhash is of your transactions
                    var trs = tr.transactions;
                    for(var i=0;i<trs.length;i++)
                        if (trhash == basiin.hash(trs[i]))
                            return true;
                }
                return false;
            }
            function _getDataUrl(imageObj)
            {
                var ima = imageObj[0],
                    fileType, qual, dataUrl='',
                    canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d');
                canvas.width = trueW;
                canvas.height = trueH;
                ctx.drawImage( ima, 0, 0 );

                fileType = ima.src.match(/[^\.]+$/)[0].toLowerCase()
                qual = undefined;
                if (fileType == 'jpg' || fileType == 'jpeg') qual=1

                dataUrl+= canvas.toDataURL('image/'+fileType, qual)
                
                return dataUrl;
            }

            _imHtml.append(frame);
            return frame; //returns just the element, might be irrelevant
        }

        function Url(src){
            
            var _isAbsolute = /^\w+\:\/\//.test(src);

            var _protocol = ''
            var _domain = ''
            if (_isAbsolute){
                _protocol = src.match(/^[^:]*/);
                _domain = src.match(/^(\w+:\/\/)?([^/]+)/)[2];
            }
            
            var _path = src.match(/(^(\w+):[\/]{2})?[^\/]*(.*$)/)[3]
            var _file = src.match(/(^(\w+):[\/]{2})?[^\/]*[^\/]+$/)[3]

            var _query = src.match(/[^\?]+\??((?:[^&]&?)+)?$/)[1];
            var _params={};
            if (_query){
                var _queryitems= _query.split('&');
                
                for (var i=0; i<_queryitems.length; i++)
                {
                    var key, val, pc = _queryitems[i];
                    pc = str.split('=')
                    if(pc.length>1)
                        _params[pc[0]] = pc[1];
                    else
                        _params[pc[0]] = true;
                }
            }
            
            function _getPrefix(){
                if (_isAbsolute)
                    return _protocol+'://';
                return '';
            }
            function _getQuery(){
                var str = '';
                for(var key in _params)
                    str+= key+ "="+ _params[key]+ '&';//trailing amp should be ok

                if (str !== '')
                    str='?'+str;
                
                return str;
            }
            
            this.src = function (){
                if(_isAbsolute)
                    return _getPrefix()+ _domain+ _path+ _getQuery()
                return _path+ _file+ _getQuery()
            };

            this.param = function(name, value){
                if (name && value !== undefined)
                    return _params[name]=value;
                else
                    return _params[name];
            }
            //console.log(this);
        }

        function LocationInfo()
        {
            console.log(this)
            var that = this;
            var locObj = window.location || document.location || undefined;
            if (!locObj) alert('No location object could be found location utils will be disabled')

            this.url = locObj.href || locObj.toString() || 'undefined URL'

            this.domain = locObj.host || locObj.hostname ||
                window.location.toString().match(/^(\w+:\/\/)?([^/]+)/)[2] ||
                locObj.toString().match(/^(\w+:\/\/)?([^/]+)/)[2] ||
                'undefined domain'

            this.path = that.url.match(/(^(\w+):[\/]{2})?[^\/]*(.*$)/)[3]
            this.patha = that.path.split('/')

            this.filename = this.url.match(/([^\/]+)(\?.*$)/) //url with args
            if (this.filename && this.filename.length>0)
                this.filename = this.filename[1]
            else
                this.filename = this.url.match(/[^\/]+$/) //url without args


            //the arguments string (with `?' at front)
            this.arguments = that.url.match(/\?.*$/);
            if (this.arguments && this.arguments.length >0)
                this.arguments = this.arguments[0];

            //object containing all arg:value pairs
            this.argumenta = (function(){
                if (that.arguments ){
                    var res = that.arguments.split('?')[1].split('&')
                    var end = {};
                    for (var i=0;i<res.length;i++){
                        var param = res[i], arr;
                        if( ( arr = param.split('=')) && arr[0])
                            end[arr[0]] = arr[1];
                    }
                    return end;
                }else
                    return {}
            })();

            this.title = (function(){
                if ($('title').length > 0)
                    return $('title').html();
                else if (that.domain)
                    return that.domain;
                else
                    return 'basiin, unknown location';
            })();

            this.description = _scrapeText(['#description','.description'])
            
        }
        
        function _compactify(str)
        {
            return str.replace(/[ \t]+/g, ' ').replace(/([ ]?\n+[ ]?)+/g, '\n').replace(/^\n/,'').replace(/\n$/, '')
        }
        
        function _scrapeText(arr)
        {
            var i,q,text='';
            for(i=0;i<arr.length;i++)
                text+=$(arr[i]).text()+'\n'

            
            return _compactify(text)
        }
            

        function _isLocalImage(imageObj)
        {
            if (imageObj[0].src.substr(0,1) == '/'  ) return true;

            if (imageObj[0].src.match(/^(\w+:\/\/)?([^/]+)/)[2] == _locInfo.domain )
                return true;

            return false;
        }

        function _getTags(){
            console.log('getting tags')
            try{
                var tags = [];
                tags.push.apply(tags,
                    _scrapeText(['#tags', '.tags', '#keywords','.keywords'])
                    .split('\n') );
                tags = $.unique(tags);
                
                if (tags.length < 3 && $('meta[name="keywords"]').length >0 && $('meta[name="keywords"]').attr('content'))
                    tags.push.apply(tags, 
                        $('meta[name="keywords"]')
                            .attr('content').match(/[^,\s]+/g) );
                tags = $.unique(tags);

                if (tags.length < 12 &&  $("title").html() && $("title").html().match(/[\S]+/g))
                    tags.push.apply(tags,
                        $.grep($("title").html().match(/[\S]+/g),
                            function(str){
                                return (str.length >3) || (str.match(/^[#\d]/) )
                            }) );

                return $.unique(tags).join(', ');
            }catch(e){
                return ['no tags'];
            }
        }

        function _orderImages()
        {
            //console.log('ordering images')
            //TODO
        }

        this.uName = 'Image discovery widget (ImageCrawler)'
        this.uPhrase = 'Widget of "ImageCrawler"'
        this.event = basiin.addEvents(_events, this)

    }
}