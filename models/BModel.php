<?php
/**
 * Basiin base Model, basic functionality
 *
 * @author Kiriakos
 */
class BModel {

    public function __get($name){
        $getter = 'get'.  ucfirst($name);
        if(property_exists($this, $name))
                return $this->$name;
        if (method_exists($this, $getter))
                return $this->$getter();

        return NULL;
    }
    
}
?>
