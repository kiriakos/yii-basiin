/**
 * This is a template of a Packet type response, requests that involve packets
 * in Basiin should adhere to this guideline. None of the properties are
 * required, but most of them will have an effect when present. @ Packet:onLoad
 * Basiin will pickUp() the object and test for the existence of various things
 *
 * 
 *
 * Datatype Mixed:   these vars can be either Integers, Strings, or functions
 *
 */

var $variable_name = { // eg: $transfer__variable_name Packet.options.variable 
                       //is the client side container of this value

    //Identity (the var name is also a part)
    'packetIndex': $packetIndex, // some identifier that the packet can check to
                                 // validate that this response belongs to it

    //Request status
    'success': true,             // Boolean, if the request succeded or not

    'error': null,               // Mixed, checked if success == false
                                 // Strings will be eval'd
                                 // Functions willl be called
    
    'hash': $hash,               //TODO: implement js->php cryptography
    'bytes': $bytes,             // The amount of bytes that were affeccted by
                                 // the Packet on the server's side
    'output': "$output",         // Any type of output that could be used for
                                 // error printing while debuging etc..

    //Request feedback (results)
    'data': $data,               // If the request creates output for the
                                 // client side application this is where it
                                 // should go. TYPE: Mixed and depending on
                                 // program.

    'events': {
        'onPickUp': function(){},// to be called immediately after pickup
        'onFail':   function(){},// to be called immediately after failize()
        'onSuccess':function(){} // to be called immediately after finalize()
    }

};