/**
 * Basiin splashscreen constructor
 *
 * A cacheable js initializer to provide almost instant feedback to a bookmark
 * click. Creates the lightbox and inserts the basiin/init/rand reguest
 *
 * Creates the Basiin Modal Dialogue
 *  div id=basiinBase
 *      div id=basiinContent
 *      span (powered by basiin)
 *
 *  #basiinContent is the area to display the application output
 *
 *  the basiin loading screen is the plugin that creates this object's
 *  functionality (show, hide)
 */


(function(){
    function getHightestZIndex(){
        return 1200;
    }
    var DC = function(str){return document.createElement(str)};

    window.requestAnimationFrame = window.requestAnimationFrame ||
                                   window.mozRequestAnimationFrame ||
                                   window.webkitRequestAnimationFrame ||
                                   window.oRequestAnimationFrame ||
                                   window.msRequestAnimationFrame ||
                                   function(cb){setTimeout(cb,16)};

    var supRGBA = (function(){
         var value = 'rgba(0,0,1,0.5)', el = DC('p'), result = false;
         try {
             el.style.color = value;
             result = /^rgba/.test(el.style.color);
         } catch(e) { }
         el = null;
         return function(){return result;}
    })();

    //create the lightbox to avoid navigation
    var lb = DC('div'), lbs= lb.style;
    lbs.position = 'fixed';
    lbs.zIndex = getHightestZIndex();
    lbs.top = lbs.right =  0;
    lbs.width = lbs.height = '100%';
    lbs.textAlign= 'center';
    lbs.background='gray';
    lbs.overflow='hidden';
    lb.id='basiinGui';
    lb.BGC = '10,10,10';lb.BGA = .0;lb.BGAtarget = .85;lb.darkenFrames = 13;
    lb.darken = function(){
        lb.element.style.setProperty("background", 'rgba('+ lb.BGC+ ','+ (lb.BGA+= lb.BGAtarget/lb.darkenFrames)+ ')')
        if (lb.BGA < lb.BGAtarget){
            requestAnimationFrame(lb.darken)
        }
    }

    lb.innerHTML = '<span style="text-shadow: #111 0px 0px 1px;margin:0 10px 5px 0;color:#FFF;position:absolute;right:0px;bottom:0px;z-index:1;">powered by <a style="color:#FFF" href="http://kindstudios.gr">KIND studios</a> | <a style="color:#FFF" href="http://kindstudios.gr/basiin-framework">basiin</a></span>'

    
    
    lb.element = document.body.appendChild(lb);
    //load the framework
    document.body.appendChild((function(){
        var sc = DC('script');
        sc.src='http://kindstudios.k/basiin/init/'+Math.random();
        return sc;
    })());

    //if browser supports rgba background color
    if(supRGBA()){
        lb.darken()
    }
    //else load the bg img & set it's onload event
    else{
        lbs.background='url(http://kindstudios.k/images/system/pixels/pixel.black.90.png)';
    }
})()