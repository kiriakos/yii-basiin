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

    /*************************** Hidden Properties ****************************/
    that = this;

    /*********************** Utils ******************************/
    /**
     *  Uppercase the first char of str
     */
    this.ucFirst = function (str){return str.substr(0,1).toUpperCase()+ str.substr(1);}
    this.lcFirst = function (str){return str.substr(0,1).toLowerCase()+ str.substr(1);}
    
    /*********************** Events subsytem ******************************/
    var events

    function _protoEvent (fn, event)
    {
        var title='';
        title+= (typeof event === 'object' && event.name)?
                                        event.name:'undefined event name';

        title+=(typeof event === 'object' && event.caller)?
                                        " called from "+ event.caller:'';
        
        if (typeof event === 'object' && event.meta) title += meta
     
        _log( 'event '+ title );

        var result;
        if (typeof fn === 'function') result = fn(event);
        else if (typeof fn === 'string')
        {
            if ( event.object && event.object["fn"] &&
                    typeof event.object["fn"] === 'function')
                result = event.object[fn](event)
            else
                try{result = eval(fn);}
                catch(e){result = false;}
            
        }
        else result = false;

        return result;
    }


    /**
     * Raise the on`name` event eg: that.event("Load") -> onLoad
     *
     * will check metadata if an event position is specified (eg: 'BEFORE', "after")
     *
     * Returns either the return value of the event's function or undefined
     * if no function was defined or false if something went wrong
     * 
     */
    this.event = function (name, metadata)
    {

        name = _generateEventName (name, metadata);


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
        _log('event on'+name+ ' fired but didn\'t exist', 4);
        return undefined; //undefined events return undefined in stead of false
    }

    /**
     *  Generates an event name from passed event Params
     *
     *  DEPRECATED: don't use metadata to specify the event, future vesions
     *              will only use event name as the identifier! Raise events
     *              only by fully quoalified descriptors eg:
     *              that.event("beforeLoad")
     */
    function _generateEventName ()
    {
        name = undefined
        metadata = undefined

        if (arguments.length >0 ) name = arguments[0]
        if (arguments.length >1 ) metadata= arguments[1]

        /**
         *  check if metadata specifies before or after clause
         *  set the event point to "onAfterEventname"
         */
        if (typeof metadata === 'string')
        {
            var tpoint;
            if ( (tpoint = metadata.match(/[a-zA-Z]+/)) && (tpoint=tpoint[0]) )
            {
                tpoint = tpoint.toLowerCase();
                if (tpoint == 'after' || tpoint == 'before')
                    name = tpoint.toLowerCase()+ that.ucFirst(name);
                else
                    name = 'after'+ that.ucFirst(name);
            }
        }
        //if not and no after/before is in the name add the "after" clause
        else if(!that.lcFirst(name).match(/^after/) &&
                    !that.lcFirst(name).match(/^before/)){
            name= 'after'+that.ucFirst(name);
        }

        name = that.ucFirst(name);

        return name;
    }

    /**
     * _addEventsFromObject
     *
     *strip event identifiers from an options object return the events obj
     *should be called by the base obj on it's init
     *
     *  DEPRECATED: the event name construciton system will be removed in the
     *              future, assigne events only with fully qualified names eg:
     *              "onAfterInitialize"
     */
    this.addEvents = function (object)
    {
        events = {};
        //filter event properties out of the rest
        for (var p in object)
            if (p.substr(0,2) == 'on' && p.substr(2,1).match(/[A-Z]{1}/))
            {
                var eventName = p;

                //turn "onLoad" to "onAfterLoad"
                if (!that.lcFirst(eventName).match(/^onAfter/) &&
                    !that.lcFirst(eventName).match(/^onBefore/))
                {
                    eventName= 'onAfter'+ that.ucFirst(p.substr(2));
                }

                events[eventName] = object[p];
            }

//        console.log("added events:")
//        console.log(events)
        return events;
    }
    
    this.hasEvent = function (str){return (events[str] == undefined);}

    function _getEventCallerId ()
    {
        //TODO: generate an ID scheme that is more elegant
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
    this.addEvent = function (event, fn, force)
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

