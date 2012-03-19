/**
 *  Base object that owns the events subsystem
 */
var BasiinObjectPrototype = function ( events, options ) {
    function _protoEvent (fn, event, object)
    {
        var title = (typeof event === 'object')?event.name:'undefined event name';
        _log( 'event fired: '+ title );

        var result;

        if (typeof fn === 'function') result = fn();
        else if (typeof fn === 'string')
        {
            if (object.hasOwnProperty(fn)) result = object[fn]()
            else result = eval(fn);

        }
        else result = false;

        return result;
    };

    function _raiseEvent(name, metadata)
    {
        if(events['on'+name])
        {
            var event={
                'name':name,
                'object':'Transfer'
            }
            if (desc) event.description = desc;
            return _protoEvent(_params['on'+name], event, _self)
        }
        return false;
    }

    var intrfc = {
        _event: _raiseEvent,
        hasEvent: _hasEvent,
        addEvent: _addEvent
    }
    
    return intrfc;
}

