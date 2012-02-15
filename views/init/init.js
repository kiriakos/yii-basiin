// This is a Basiin script all strings that begin with a dollar sign will be
// replaced with data from the utilized controller

// don't litter namespace //var $transaction__id =
(function( debug ){
    /***************************************************************************
     * Private
     **************************************************************************/
    var _initialized = false;
    var _transaction = {
        'id': "$transaction__id" , 'transactions': $transactions,
        'afterInit': "$command", //somethign to execute afer basiin loads
        'timeout': $transaction__ttl,
        'server': {
            'location': "$homeDomain",
            'domain': "$homeDomain",
            'basiin': "$basiinPath",
            'file': "$filePath",
            'tell': "$transaction__defaultPath" //where data goes when path not set
        },
        'maxTransfers': "$transaction__maxTransfers", // server transfer limit
        'maxElements': "$transaction__maxElements" //browser load limit
    };
    
    
    //don't run if a basiin session is already existing
    for (var i=0; i<_transaction.transactions.length; i++){
        if (window.hasOwnProperty(_transaction.transactions[i]) ){
                /* trimmed: && _transaction.transactions[i] != _transaction.id
                 * even if the trans_id is the same the fw should not load.
                 * the public var is created in init
                 */
                console.log('('+_transaction.id+') ' + 'Basin session is running, hold on');
                return {init:function(){return null}}; // null or an object with init()?
    }}
    
    var $__hash
    var $__loader
    var $__elements
    
    /***************************************************************************
     * Public interface
     **************************************************************************/
    return $__interface
})( $debug ).init();
