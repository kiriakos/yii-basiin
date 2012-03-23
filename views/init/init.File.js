function File(o)
{
    /* private properties */
    var _state=0;
    var _states={queued:0,installing:1,installed:2,uninstalled:3}
    
    /* defaults */
    var _params={
            'packageName':null, // a valid variable name, uniquely identifying
                                // the package
            'fileName':null, // string pointing to the file containing the
                             // package, relative to "script" directory
            'forceInstall':false,   //if set to true _extend will be used with
                                    //the force flag

            'element':null,
            'variable':null,
            
            /* Events */
            'onBeforeLoad':null,
            'onAfterLoad':null,
            'onBeforeError':null,
            'onAfterError':null,
            'onBeforeInstall':null,
            'onAfterInstall':null
            
    }
    var _package; // placeholder, this is the variable to witch the pickUp gets assigned
    
    function _fileOnLoadHook(event)
    {
        _package = _pickUp("packageName")
        if(_state==_states.installing)
        {
            that.event('beforeInstall')

            if ( _isStandardPackage() )
                _standardInstall();

            that.event('afterInstall')   
        }

        that.event('afterLoad')
    }
    function _fileOnLoadErrorHook(event)
    {
        that.event('afterError');
    }

    /**
     * validates that the received script is a standardized basiin package
     */
    function _isStandardPackage()
    {   //true if _package is trueish and has either payload or install
        return ( _package && (_package.payload || _package.install));
    }

    /**
     * Perform a standard install of the package
     * Only run when _package _isStandardPackage
     */
    function _standardInstall()
    {
        //old instal proc:
        //_extend(_params.packageName, _pickUp(_params.variable), true)
        if (_package.install) return _package.install();
        else //do default install
        {
            var extObj
            if (_package.extendPackage)
                extObj = _getPackageRefference(_package.extendPackage)
            else
                extObj = basiin;

            return _extend(_params.packageName, new _pacakge.payload(), extObj, _params.forceInstall);
        }

    }

    /* public accessors*/
    this.state = function(){return _state;}
    this.isInstalled  = function () {return _state == _states.installed}
    this.isInstalling = function () {return _state == _states.installing}
    this.isQueued     = function () {return _state == _states.queued}
    this.isUninstalled= function (){return _state == _state.uninstalled;}

    this.uName      = "File Installation: "+ o.packageName+ " ("+ o.fileName+ ")"

    /* public methods */
    this.install = function _install()
    {
        if(this.isQueued())
        {
            _params.element = _elements.script(
                                ["file",_params.fileName],
                                _fileOnLoadHook,
                                _fileOnLoadErrorHook
                            );
            _state = _states.installing;
            return true;
        }
        else return false;
    }
    
    /*********************      Initialize     ****************************/

    var that = this;
    
    for(var option in o){_params[option] = o[option]}
    if (_params.variable == null) _params.variable = _varHash(_params.packageName);

    //DEPRECATED: now _fileOnLoadHook manages the install procedure
    //create an event hook to the default install behavior if no onLoad hook exists
    //if (!_params.onLoad) _params.onLoad = _extend(_params.packageName, _pickUp(_params.variable), true);
    
    this.event = this.addEvents(_params);
}
File.prototype = new BasiinObjectPrototype();