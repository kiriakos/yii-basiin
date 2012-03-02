function File(o)
{
    /* private methods */
    function _install()
    {
        if(_queued())
        {
            _params.element = _elements.script(
                                ["file",_params.file],
                                _createLoadFunc(_params.onLoad)
                            );
            _state = _states.installing;
            return true;
        }
        else return false;
    }

    function /* bloat */ _uninstall()
    {
        if(_installed()) 
        {
            _state = _states.uninstalled;
            return _backup = basiin[_params.tag];
        }
        else return false;
    }

    function /* bloat */ _reinstall(force)
    {
        if(_uninstalled())
        {
            _extended = _extend (_params.tag, _backup, force);
            if (_extended) _state = _states.installed;
            return _extended;
        }
        else return false;
    }

    /* event behaviors */


    /**
     *  If the File recieved a custom onload event call that one otherwise
     *  continue with the default installation, taking whatever is in the
     *  global variable variable and expanding it into basiin (forced expansion).
     */
    function _createLoadFunc(func)
    {
        var result;
        if (func)
        {
            result = function(){
                _log("file: "+ _params.tag +" file.onload fired");
                var r = func()
                if (r) _state = _states.installed;
                return r;
            };
        }
        else 
        {
            result = function(){
                _log("file: "+ _params.tag +" file.onload fired");
                r = _extend(_params.tag, _pickUp(_params.variable), true);
                
                if (r) _state = _states.installed;
                return r;
            }
        }
        
        return result;
    }

    /* private accessors*/
    function _installed () {return _state == _states.installed}
    function _installing () {return _state == _states.installing}
    function _queued () {return _state == _states.queued}
    function _uninstalled(){return _state == _state.uninstalled;}

    /* private properties */
    var _state=0;
    var _states={queued:0,installing:1,installed:2,uninstalled:3}
    var _backup;
    
    /* defaults */
    var _params={'tag':null, 'file':null, 'onLoad':null, 'element':null, 'variable':null}
    for(option in o){_params[option] = o[option]}
    if (_params.variable == null) _params.variable = _varHash(_params.tag);

    /* init */
    function _init(){
        /* placeholder */
    }

    /* interface */
    var _interface = {
        //controll
        install:_install,
        uninstall:_uninstall, /* bloat */
        reinstall:_reinstall, /* bloat */

        //
        installed: _installed,
        installing: _installing,
        queued: _queued,
        uninstalled: _uninstalled,
        state: function(){return _state;} //get the numeric value of the File's state
        
    };
    
    return _interface;
}