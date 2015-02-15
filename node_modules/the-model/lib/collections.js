
var jQuery = require('cheerio');

var common = require('./common.js');

var System = System || {};

//Create System.Collection namespace
common.extend(System, 'Collections');

System.Collections.KeyValuedPair = (function () {
    
    function KeyValuedPair() {
        
        if (arguments.length) {
            Object.defineProperties(this, {
                "key": {
                    __proto__: null, // no inherited properties
                    value: arguments[0],
                    enumerable: true,
                    writable: false
                },
                "value": {
                    __proto__: null, // no inherited properties
                    value: arguments[1],
                    enumerable: true,
                    writable: arguments[2] ? false : true
                }
            });
        }
    }    ;
    
    return KeyValuedPair;
})();


//A collection of key-valued pairs. Each pair consists of an identifier(key) and its associated value(value).
System.Collections.List = (function (keyValuedPair, $) {
    var search;
    var isEqual = function (item, array) {
        return item.key === this[0] || item === this[0];
    };
    var isGrepEqual = function (item, array) {
        return item.key === search || item === search;
    };
    
    function List() {
        this.items = [];
        List.prototype.addItem.apply(this, arguments);
    }    ;
    List.prototype.getItem = function (that) {
        search = that;
        //var list = this.items.filter(isEqual, [search]);
        var list = $.grep(this.items, isGrepEqual);
        var found = null;
        if (list.length) {
            found = list[0];
            if (list.length > 1) {
                debugger;
            }
        }
        if (found) {
            var task = function () {
                found = window.$find(found.value) || found.value || found;
                found.value = found;
            };
            //setTimeout(task, 1);            
            task();
        }
        return found;
    };

    List.prototype.addItem = function () {
        for (var i = 0; i < arguments.length; i++) {
            if (Object.getPrototypeOf(arguments[i]) === Object.getPrototypeOf(new System.Collections.KeyValuedPair())) {
                var kvPair = arguments[i];
                search = kvPair.key;
                
                //var candidate = this.items.filter(isEqual, [kvPair.key]);
                var candidate = $.grep(this.items, isGrepEqual);
                if (candidate.length) {
                    var index = this.items.indexOf(kvPair);
                    var value, newPair;
                    
                    if (index !== -1) {
                        //DO overwrite
                        //this.items[index] = kvPair; 
                        value = kvPair.value.get_element ? $(kvPair.value.get_element())[0].id : kvPair.value;
                        newPair = new System.Collections.KeyValuedPair(kvPair.key, value);
                        this.items[index] = newPair;
                    }
                } else {
                    value = kvPair.value.get_element ? $(kvPair.value.get_element())[0].id : kvPair.value;
                    newPair = new System.Collections.KeyValuedPair(kvPair.key, value);
                    this.items.push(newPair);
                }
            }
        }
    };
    List.prototype.dispose = function () {
        this.items = [];
    }
    return List;
})(System.Collections.KeyValuedPair, jQuery);

module.exports = System.Collections;

