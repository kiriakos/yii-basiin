/**
 *  Base object that owns the events subsystem
 *
 *  usage: after object declaration add:
 *  "ObjectConstructorName.prototype = new BasiinObjectPrototype ();"
 *  At object instantiation call addEvents(obj) where `obj` is an object that
 *  holds the event names eg: {onLoad:fn, onComplete:otherFn}
 *
 *  whenever an event happens just call event('eventName' [, "metadata"])
 *  eg: event("AfterInitialize")
 */
function BasiinObjectPrototype () {

    /*********************** Utils ******************************/
    /**
     *  Uppercase the first char of str
     */
    this.ucFirst = function (str){return str.substr(0,1).toUpperCase()+ str.substr(1);}


    /*********************** Events subsytem ******************************/
    var events

    var _protoEvent = function _protoEvent (fn, event)
    {
        var title='';
        title =(typeof event === 'object' && event.caller)?
                                        event.caller+ " / ":'';
        title+= (typeof event === 'object' && event.name)?
                                        event.name:'undefined event name';

        if (typeof event === 'object' && event.meta) title += meta
     
        _log( 'event fired: '+ title );

        var result;
        if (typeof fn === 'function') result = fn(event);
        else if (typeof fn === 'string')
        {
            if ( event.object && event.object["fn"] && typeof event.object["fn"] === 'function')
                result = event.object[fn](event)
            else
            {
                try{result = eval(fn);} //can't attach event object here
                catch(e){result = false;}
            }
        }
        else result = false;

        return result;
    }


    /**
     * Raise the on`name` event (eg: onLoad)
     *
     * will check metadata if an event position is specified (eg: 'BEFORE', "after")
     */
    this.event = function _raiseEvent(name, metadata)
    {

        //check if metadata specifies before or after clause
        if (typeof metadata === 'string')
        {
            var tpoint;
            if ( (tpoint = metadata.match(/[a-zA-Z]+/)) )
            {
                tpoint = tpoint.toLowerCase();
                if (tpoint == 'after' || tpoint == 'before')
                    name = tpoint.toLowerCase()+ this.ucFirst(name);
            }
                
        }else{
            name= 'after'+this.ucFirst(name);
        }
        
        
        name = this.ucFirst(name);


        if(events['on'+name])
        {
            var event={
                'meta':metadata,
                'name':name,
                'caller':_getEventCallerId(),
                'object':this
            }
            
            return _protoEvent(events['on'+name], event)
        }

        //if event doesn't exist
        _log('event on'+name+ ' fired but didn\'t exist');
        return false;
    }

    //strip event identifiers from an options object return the events obj
    //should be called by the base obj on it's init
    this.addEvents = function _addEventsFrom(object)
    {
        events = {};
        //filter event properties out of the rest
        for (var p in object)
            if (p.substr(0,2) == 'on' && p.substr(2,1).match(/[A-Z]{1}/))
                events[p] = object[p];

        
        return events;
    }
    
    this.hasEvent = function _hasEvent(str){return (events[str] == undefined);}

    var _getEventCallerId = function _getEventCallerId()
    {
        var id = "undefined caller Obj"
        if (typeof this.objectIdentifier=== 'string') 
            id = this.objectIdentifier
        else if (typeof this.objectIdentifier=== 'function')
            id = this.objectIdentifier()
        else if (this.id) id = this.id
        else if (this.tag) id = this.tag

        return id;
    }

    /**
     * Add another event pointer to the events object
     */
    this.addEvent = function _addEvent (event, fn, force)
    {
        var ev = 'on'+ event.charAt(0).toUpperCase()+ event.substr(1)
        if (_params[ev] === null || force)// event defaults are null
            _params[ev] = fn;

        return _params[ev]
    }

    /**
     * return an array of all the events for which this instance listens
     */
    this.registeredEvents = function (){
        var arr = []
        for(var e in events) arr.push(e);
        return arr;
    }
}

