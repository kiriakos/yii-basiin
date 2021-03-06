/**
 * This is the recomended format for package installation via basiin.install()
 *
 * 
 */

var $__packageSafeName = {

    dependencies: [ //packages that are required for this package to be installed
                //only add top lvl packages here eg
        {
            packageName: "$packageSafeName",
            fileName:'$packageFilePath',
            onAfterInstall:'eval string',       //events must be eval strings
            onBeforeInstall:"more eval string"  //in order to get access to
                                                //basiin's scope(and the file
                                                //object) also this  code must
                                                //have a return value of true
                                                //in case install succeeds
                                                //(for non standard packages)

        }, //where file path is relative to Basiin::packagePath
        {
            packageName:'jQuery',
            fileName:'jquery-1.7.1.min.js'
        }
    ],

    /**
     *  
     */
    payload:function(basiin){
        // the default behavior (when install is undefined) is to instantiate
        // this object through the new keyword
    },

    /**
     *  Function || evaluatable string
     *  @return boolean
     */
    install:function(basiin){
        //if this is a function in stead of undefined (undefined is default)
        //basiin will run this function when the script arrives
        //@return boolean
    },

    /**
     * String
     * 
     *if the package extends basiin.pkg2.ext3 and it's safeName
     *is plug34 you can set extend to "pkg2.ext3" that will tell
     *the install behavior to put the plug34 code into
     * basiin.pkg2.ext3.plug34 = new payload(basiin);
     *
     *default: undefined
     */
    extendPackage:"string"  

}

