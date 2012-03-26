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
            'variable':null, // the value of $packageSafeName, optional. Defaults to _params.packageName

            /* Events */
            'onBeforeLoad':null,
            'onAfterLoad':null,
            'onBeforeError':null,
            'onAfterError':null,
            'onBeforeInstall':null,
            'onAfterInstall':null
            
    }
    var _package; // placeholder, this is the variable to witch the pickUp gets assigned
    var _pacakgeVariableBackupValue;

    /**
     *Element event hooks
     */
    function _fileOnLoadHook(event)
    {
        that.event('beforeLoad')
        _package = _pickUp(_params.variable, _pacakgeVariableBackupValue)
        
        _preInstall();

        that.event('afterLoad')
    }
    function _fileOnLoadErrorHook(event)
    {
        that.event('afterError');
    }

    /**
     *  Checks to make sure everything is set up for the install to begin
     */
    function _preInstall()
    {
        if(_state==_states.installing)
        {
            var result = false;
            if ( _isStandardPackage() )
            {
                if( _dependenciesInstalled() )
                    result = _standardInstall();
                else
                    _installDependencies();
                    
            }
            else
            {
                //In order to be able to check wether the non Standard pkg
                //was correctly installed this process checks whether either
                //before or after the install a function returns `(bool)true`
                //these events are otherwise fired by (_standardInstall)
                if (that.event('beforeInstall') || that.event('afterInstall'))
                    result = true;
            }

        }
        if (result) _state = _states.installed;
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
        var result = true;
        
        _log("Performing standard install of package "+ _params.packageName, 4);
        result = result && (that.event('beforeInstall') !== false);

        if (_package.install && result) 
            result = result && (_package.install() !== false);
        
        else if (result)//do default install
        {
            var extObj
            if (_package.extendPackage) extObj = _getPackageRefference(_package.extendPackage)
            else extObj = basiin;

            if (extObj)
                result = result && _extend(_params.packageName, new _package.payload(), extObj, _params.forceInstall);
        }

        //AfterInstall isn't fired if install fails
        result = result && (that.event('afterInstall') !== false);
        return result;
    }

    function _getPackageRefference(pkgString)
    {

        var pkgArr = pkgString.split(".");
        var ref = basiin;

        for (var i=0; i<pkgArr.length;i++)
            if(ref[pkgArr[i]])
                ref = ref[pkgArr[i]]
            else
                return false;
            
        return ref;
    }

    function _dependenciesInstalled()
    {
        
        _log("Checking dependencies of "+ _params.packageName, 4)
        if (!_package.dependencies) return true;

        for (var i=0; i<_package.dependencies.length; i++)
            if(!_loader.getFile({'uName':_package.dependencies[i].packageName, "isInstalled":true}))
                return false;

        _log("All dependencies appear to be installed")
        return true;
    }
    function _installDependencies()
    {
        for (var i=0; i<_package.dependencies.length; i++)
        {
            var pkg = _package.dependencies[i];
            var oal = pkg.onAfterLoad;
            pkg.onAfterLoad = function(event){
                        var result = false;
                        if(oal) result = oal(event);
                        _preInstall();
                        return true;
                    }
            if(!_loader.getFile({'uName':pkg.packageName})) //only install files that aren't installed
                _loader.install( pkg )
                    // all packages being installed will call this obj's _preInstall
                // when the last package gets successsfully installed _preInstall
                // will finaly install the package

        }
    }

    /* public accessors*/
    this.state = function(){return _state;}
    this.isInstalled  = function () {return _state == _states.installed}
    this.isInstalling = function () {return _state == _states.installing}
    this.isQueued     = function () {return _state == _states.queued}
    this.isUninstalled= function () {return _state == _state.uninstalled;}

    this.uName      = o.packageName
    this.uPhrase    = "File Installation: "+ o.packageName+ " ("+ o.fileName+ ")"
    /* public methods */
    this.install = function ()
    {
        if(this.isQueued())
        {
            _log("Starting install procedure of "+ _params.packageName, 3)
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
    this.getPackage = function (){ return _package;}
    
    /*********************      Initialize     ****************************/

    var that = this;


    for(var option in o){_params[option] = o[option]}
    if (_params.variable == null)
        _params.variable = _params.packageName;

    _pacakgeVariableBackupValue = window[_params.variable];

    this.event = this.addEvents(_params);
}
File.prototype = new BasiinObjectPrototype();