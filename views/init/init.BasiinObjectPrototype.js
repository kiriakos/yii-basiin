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
    var bop = this;
    /*********************** Utils ******************************/
    /**
     *  Uppercase the first char of str
     */
    this.ucFirst = function (str){return str.substr(0,1).toUpperCase()+ str.substr(1);}
    this.lcFirst = function (str){return str.substr(0,1).toLowerCase()+ str.substr(1);}
    
    /*********************** Events subsytem ******************************/
    var events = {}

    /**
     * return an initialized event funcitonObject listening to all events
     * its parent object has (only the partens)
     */
    this.addEvents = function (object)
    {
        return new _constructEventSystem(object, this) ;
    }

    /**
     * Constructor for the event function object
     * 
     */
    function _constructEventSystem(eventsObject, parent){

        var _events =[]
        var _parent = parent;
        
        var _callerId = "undefined caller Obj";
        if (typeof parent.uPhrase=== 'string')
            _callerId = parent.uPhrase
        else if (typeof parent.uPhrase=== 'function')
            _callerId = parent.uPhrase()

        function _raise (fn, event)
        {
            var title='';
            title+=(typeof event === 'object' && event.caller)?
                                            event.caller+ ' fired ':'';
            title+= (typeof event === 'object' && event.name)?
                                            event.name:'undefined event name';

            

            if (typeof event === 'object' && event.meta) title += meta

            _log( title );

            var result = _execfn(fn,event);
            

            return result;
        }

        /**
         *  returns the value of the event computation or undefined if no
         *  computation happened. returns false if an error ocured
         */
        function _execfn(fn, event){
            try{
                if (typeof fn === 'function')
                    return fn(event);
                else if (typeof fn === 'string')
                {
                    if ( event.object && event.object["fn"] &&
                            typeof event.object["fn"] === 'function')
                        return event.object[fn](event);
                    else
                        return eval(fn);
                }
            }catch(e){
                return false;
            }
            
            return undefined;
        }

        function _proxy(fn, args)
        {
            return eval("("+ fn+ ")")(args);
        }

        /**
         * Raise the on`name` event eg: bop.event("Load") -> onLoad
         *
         * will check metadata if an event position is specified (eg: 'BEFORE', "after")
         *
         * Returns either the return value of the event's function or undefined
         * if no function was defined or false if something went wrong
         * this is being executed in the parent's scope
         */
        function event (name, metadata){
            
            name = bop.ucFirst(name);

            if(_events['on'+name])
            {
                var event={
                    'meta':metadata,
                    'name':name,
                    'caller':_callerId,
                    'object':this,
                    'basiin':basiin, //allow alien scopes access to basiin
                    'proxy': _proxy
                }

                return _raise(_events['on'+name], event)
            }

            //if event doesn't exist
            _log( _callerId+ ' fired on'+name+ '. No hook!', 4);
            return undefined; //undefined events return undefined in stead of false
        }

        event.add = function(object, force)
        {
            //filter event properties out of the rest
            for (var p in object)
                if (p.substr(0,2) == 'on' && p.substr(2,1).match(/[A-Z]{1}/))
                {
                    var eventName = p;

                    //DEPRECATED: turn "onLoad" to "onAfterLoad"
                    if (!bop.lcFirst(eventName).match(/^onAfter/) &&
                        !bop.lcFirst(eventName).match(/^onBefore/))
                        eventName= 'onAfter'+ bop.ucFirst(p.substr(2));

                    //append if non existing or forced
                    if ( object[p] && (events[eventName] === undefined || force) )
                        _events[eventName] = object[p];
                }
        }

        event.exists = function(str) {return (_events[str] == undefined);}
        event.events = function (){
            var es = {}
            for(var e in _events) es[e] = _events[e];
            return es;
        }

        event.add(eventsObject);
        return event;
    }


}

