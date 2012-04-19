/**
 * This is the recomended format for package installation via basiin.install()
 *
 * 
 */

var jQueryProxy = {

    dependencies: [ 
        //packages that are required for this package to be installed
        //only add top lvl packages here eg
        {
            packageName:'jQuery', //example of non standard package installation
            fileName:'jQuery-1.7.1.min.js',
            onAfterInstall:"event.basiin.x( 'jQuery', event.object.getPackage().noConflict(true));"
        }
    ],

    payload:function jQueryProxyPackageForInstallDebugging(basiin){
        this.one = 1
        this.alert = function (str){alert(str)};
        this.noConflict = function()
        {
            console.log("I'm not conflicting!!!"); return true;
        }
    },

    install:null,
    extendPackage:null  
    

}


