function File(o)
{
    /* private properties */
    var _state=0;
    var _states={queued:0,installing:1,installed:2,uninstalled:3}
    var _backup;
    
    /* defaults */
    var _params={'tag':null, 'file':null, 'onLoad':null, 'element':null, 'variable':null}

       
    function _fileLoaded(){
        if(_state==_states.installing)
        {
            console.log(that)
            that.event('load')
        }
    }


    /* public accessors*/
    this.state = function(){return _state;}
    this.installed  = function _installed () {return _state == _states.installed}
    this.installing = function _installing () {return _state == _states.installing}
    this.queued     = function _queued () {return _state == _states.queued}
    this.uninstalled= function _uninstalled(){return _state == _state.uninstalled;}


    /* public methods */
    this.install = function _install()
    {
        if(this.queued())
        {
            _params.element = _elements.script(
                                ["file",_params.file],
                                _fileLoaded
                            );
            _state = _states.installing;
            return true;
        }
        else return false;
    }

    this.uninstall = function _uninstall()
    {
        if(this.installed())
        {
            _state = _states.uninstalled;
            return _backup = basiin[_params.tag];
        }
        else return false;
    }

    this.reinstall = function _reinstall(force)
    {
        if(this.uninstalled())
        {
            _extended = _extend (_params.tag, _backup, force);
            if (_extended) _state = _states.installed;
            return _extended;
        }
        else return false;
    }


    /*********************      Initialize     ****************************/
    for(var option in o){_params[option] = o[option]}
    if (_params.variable == null) _params.variable = _varHash(_params.tag);

    //create an event hook to the default install behavior if no onLoad hook exists
    if (!_params.onLoad) _params.onLoad = _extend(_params.tag, _pickUp(_params.variable), true);

    //this.__proto__ = new BasiinObjectPrototype ();
    //console.log(this)
    
    var that = this;
    this.addEvents(_params);
    console.log(this.registeredEvents())

}
File.prototype = new BasiinObjectPrototype();