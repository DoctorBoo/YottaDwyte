var jQuery = require('cheerio');

var common = (function ($, undefined) {
    var verboseMode = true;
    var self;
    
    $(function () {
        init();

    });
    
    var init = function () {
        self = common;        
    }
    

    var writeTrace = function () {
        var max = arguments.length;
        var arg = arguments[0];
        if (verboseMode && max && console[arg] && typeof console[arg] === "function" && arg === 'trace') {
            console[arg]();
            return true;
        }
        return false;
    };
    
    var writeLog = function () {
        if (window.console && verboseMode) {
            for (var i = 0; i < arguments.length; i++) {
                var that = arguments[i];
                if (!writeTrace(that)) {
                    console.log(that);
                }
            }
        }
    }
    var writeErrorLog = function () {
        if (window.console) {
            var stack = null;
            console.error("Error trace and info.");
            for (var i = 0; i < arguments.length; i++) {
                var that = arguments[i];
                if (typeof that === "object" &&
                    Object.getPrototypeOf(that) instanceof Error) {
                    console.info(that.stack);
                    stack = that.stack;
                } else {
                    console.info(that);
                }
            }
            if (!stack) { console.trace(); }
            throw new String('exception. Analyze error trace.');
        }
    }
    // a convenience function for parsing string namespaces and 
    // automatically generating nested namespaces
    var extend = function (ns, nsString) {
        var parts = nsString.split('.'),
            parent = ns,
            pl, i;
        
        if (parts[0] == "myApp") {
            parts = parts.slice(1);
        }
        
        pl = parts.length;
        for (i = 0; i < pl; i++) {
            //create a property if it doesnt exist
            if (typeof parent[parts[i]] == 'undefined') {
                parent[parts[i]] = {};
            }
            
            parent = parent[parts[i]];
        }
        
        return parent;
    }
    return {
        undefined: undefined,
        writeLog: writeLog,
        writeErrorLog: writeErrorLog,
        writeTrace: writeTrace,
        extend: extend,
        init: init
    };
}(jQuery, undefined));
var System = System || {};

//Create System.Collection namespace
common.extend(System, 'Collections');
//Put here the businessrules.
//NOTE: Observable's content will be handled here implicitly!
var Validator = (function () {
    
    function Validator() {
        this.assert = function (condition, message) {            
            if (!condition) {
                message = message || "Assertion failed";
                if (typeof Error !== "undefined") {
                    throw new Error(message);
                }
                throw message; // Fallback
            }
        }
    }
    //implement here the syndication
    var validateRulesAsync = function (observable, observer, acknoRule) {
        var deferred = $.Deferred();
        var count = 0;
        var listActionables = [], listFailures = [];
        var observableOk, observerOk, acknoRuleOk;
        //var validator = new Validator();
        
        var actions = function () {
            $.each(listActionables, function (i, actionable) {
                actionable.action();
            });
        };
        var updateObserver = function (value) {
            observer.newValue = value;
            actions();
        };
        
        observable.promise.always(function () {
            deferred.notify(++count);
        });
        observable.promise.done(function (value) {
            observableOk = true;
            observable.overridePrecedence = true;
        });
        observable.promise.fail(function (value) {
            observable.overridePrecedence = null;
            listFailures.push(observable);
        });
        
        observer.promise.always(function () {
            deferred.notify(++count);
        });
        
        observer.promise.done(function (value) {
            observerOk = true;
            observer.overridePrecedence = true;
            common.writeLog(value);
            if (observer.get_message) {
                $.wait(200).done(function () {
                    var message = acknoRuleOk ? observable.newValue : observable.originalValue;
                    if (!observable.sender.isRefindicator && observable.overridePrecedence) { // && observable.overridePrecedence?
                        message = observable.originalValue;
                    }
                    observer.get_message(message)
                        .done(updateObserver);
                });
            }
            listActionables.push(observer);
        });
        observer.promise.fail(function (value) {
            observer.overridePrecedence = null;
            listFailures.push(observer);
        });
        
        //TODO: Handle a specific acknowlegdment process here.
        acknoRule.always(function () { deferred.notify(++count); });
        acknoRule.done(function (value) {
            acknoRuleOk = true;
        });
        acknoRule.fail(function (value) {
            listFailures.push(acknoRule);
        });
        var success = function (value) {
            common.writeLog(value);
            actions();
            var state = deferred.promise().state();
            //validator.assert(state === 'pending', 'By design: resolve promise when all is done.');
            deferred.resolve(value);
        };
        var fail = function (value) {
            common.writeLog(value);
            //NOTE: NEVER reject
            var state = deferred.promise().state();
            //validator.assert(state === 'pending', 'By design: resolve promise when all is done.');
            deferred.resolve(value);
        };
        
        //All synchronous/async callbacks are a go.
        $.when(observable.promise, observer.promise, acknoRule)
            .done(success)
            .fail(fail);
        
        //Note: blocking thread.
        //while (observable.promise.state() === 'pending' || observer.promise.state() === 'pending' || acknoRule.state() === 'pending') {
        //    $.wait(200);
        //};
        return deferred.promise();
    }
    
    Validator.prototype.validation = function (observable, observer) {
        var deferred = $.Deferred();
        var overrideRuleObserver = $.Deferred();
        var overrideRuleObservable = $.Deferred();
        var handshakeRule = $.Deferred();
        
        if (observer.get_type() === 3) {
            overrideRuleObserver = validateOverrideDu(observer.id, observer.name, observer);
        } else {
            overrideRuleObserver = validateOverride(observer.id, observer.name, observer);
        }
        overrideRuleObservable = validateOverride(observable.id, observable.name, observable);
        
        observer.promise = overrideRuleObserver;
        observable.promise = overrideRuleObservable;
        
        if (!observable.isRefindicator && !observer.isRefindicator) {
            handshakeRule = $.Deferred().resolve();
        } else {
            //either one is the refindicator.
            //TODO: handshake.
            if (observable.isRefindicator) {
                var subscriberDuName = common.getObserver(null, observable.id, "DuName");
                var originalValue = subscriberDuName.viewModel.comboBoxReferenceIndicatorOrignalValue;//$(observable.htmlElt).val();  
                if (observable.sender instanceof Observlet.Observable) {
                    handshakeRule = validateHandshake(originalValue, observable);
                } else {
                    handshakeRule = $.Deferred().resolve(); //handshakeRule = validateHandshake(observable.id, observable.newValue);   
                }
            } else {
                handshakeRule = $.Deferred().resolve(); //handshakeRule = validateHandshake(observer.id, observer.newValue);
            }
        }
        
        return validateRulesAsync(observable, observer, handshakeRule);
    }
    ///Returns a promise: done if associated html element has override, reject if element has the no override
    function validateOverride(dataid, columnName, owner) {
        var deferred = $.Deferred();
        var myObject = new Object();
        myObject.dataid = dataid;
        
        var devUrl = "MapUtilService.asmx/GetOverridePrecedence";
        var deploymentUrl = common.deploymentUrl(devUrl);//common.deploymentUrl(devUrl);
        var succes = function (data) {
            try {
                var transformed = JSON.parse(data.d);
                var overridePrecedence = transformed.OverridePrecedence;
                
                if (overridePrecedence === columnName || overridePrecedence === '') {
                    deferred.resolve(owner);
                    //element's content has the overrideprecedence. Its business rule has priority to apply some action on it's content.
                } else {
                    deferred.rejectWith(this, [owner]);
                    //element's content may change.
                }
            } catch (e) {
                deferred.rejectWith(this, [e, owner]);
            }            ;
        };
        var fail = function () {
            deferred.rejectWith(this, [owner]);
        };
        
        $.when($.ajax({
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            url: deploymentUrl,
            data: JSON.stringify({ "clientLog": myObject })
        })).then(succes, fail);
        
        return deferred.promise();
    }
    //Reject if there is no handshake , otherwise resolve.
    function validateHandshake(originalValue, observable) {
        var deferred = $.Deferred();
        var devUrl = "MapUtilService.asmx/ProcessHandshake";
        var deploymentUrl = common.deploymentUrl(devUrl); //common.deploymentUrl(devUrl);
        
        var myObject = new Object();
        myObject.dataid = observable.id;
        myObject.oldValue = originalValue;
        myObject.newValue = observable.newValue;
        myObject.columnChanged = common.state.REFINDICATOR;
        
        $.ajax({
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            url: deploymentUrl,
            data: JSON.stringify({ "handshake": myObject }),
            success: function (data) {
                try {
                    var transformed = JSON.parse(data.d);
                    
                    if (transformed.Succeeded === "false") {
                        deferred.rejectWith(this, [observable]);
                    } else {
                        deferred.resolve(observable);
                    }
                } catch (e) {
                    deferred.rejectWith(this, [e, observable]);
                }                ;
            },
            error: function (e) {
                deferred.reject();
                common.writeErrorLog(this, e, arguments);
            }
        });
        return deferred.promise();
    }    ;
    
    //Reject if DU has the override , otherwise resolve.
    Validator.prototype.validateOverrideDu = function (dataid, columnName, owner) {
        var deferred = $.Deferred();
        var myObject = new Object();
        myObject.dataid = dataid;
        
        var devUrl = "MapUtilService.asmx/ValidateOverrideDu";
        var deploymentUrl = common.deploymentUrl(devUrl);//common.deploymentUrl(devUrl);
        var succes = function (data) {
            try {
                var mappingdata = data.d;
                common.writeLog('validateOverrideDu', owner, 'success:', data.d);
                if (mappingdata.DUNameChanged) {
                    deferred.rejectWith(this, [owner]);//deferred.resolve(mappingdata);
                } else {
                    deferred.resolve(owner);
                }
            } catch (e) {
                deferred.rejectWith(this, [e, owner]);
            }            ;
        };
        var fail = function () {
            deferred.rejectWith(this, [owner]);
        };
        
        $.when($.ajax({
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            url: deploymentUrl,
            data: JSON.stringify({ "arg": myObject })
        })).then(succes, fail);
        
        return deferred.promise();
    };
    Validator.prototype.Toggle = function (actor, toggleState, isAsset, isCp) {
        var deferred = $.Deferred();
        var sender = this;
        
        var devUrl = "MapUtilService.asmx/Toggle";
        var deploymentUrl = common.deploymentUrl(devUrl);//common.deploymentUrl(devUrl);
        var succes = function (data) {
            try {
                var toggle = data.d;
                common.writeLog('validateToggle', this, 'sender:', sender, 'success:', data.d);
                if (toggle) {
                    deferred.resolveWith(sender, [toggle]);
                } else {
                    deferred.resolveWith(sender, [toggle]);//deferred.resolve(mappingdata);
                }
            } catch (e) {
                deferred.rejectWith(sender, [e]);
            }            ;
        };
        var fail = function () {
            deferred.rejectWith(sender);
        };
        
        $.when($.ajax({
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            url: deploymentUrl,
            data: JSON.stringify({ "actor": actor, "toggleState": toggleState, "isAsset": isAsset, "isCp": isCp })
        })).then(succes, fail);
        
        return deferred.promise();
    };
    return Validator;
})();

System.Identity = (function () {
    function Identity(id, htmlElt, name, viewModel, getMessage) {
        this.id = id;
        this.htmlElt = htmlElt;
        if (htmlElt && $(this.htmlElt).val) {
            this.originalValue = $(this.htmlElt).val();
        } else {
            this.originalValue = {};
        }
        //i.e. columnname
        this.name = name;
        //Associated viewmodel.
        this.viewModel = viewModel;
        this.get_message = getMessage;
        
        //Indicates how long to wait before watching for updates due to network & GUI.
        //This is needed when AJAX-requests are not promises of System.Identity prototypes.
        //TODO: replace any AJAX-request with promises of the System.Identity prototype.
        this.watchDelay = 1500;
    }
    Identity.prototype.action = function () {
        try {
            if (this.get_type() !== 4) {
                this.set_value(this.newValue);
                this.originalValue = this.newValue;
            }
        } catch (e) {
            common.writeErrorLog(this, e, arguments);
        }
    }
    
    //TODO: replace {type : 1 = refind, 2 = topology, 3 = duname, 4 = readonly} with closure.
    Identity.prototype.get_type = function () {
        var type = undefined;
        return type;
    }
    Identity.prototype.get_value = function () {
        return $(this.htmlElt).val();
    }
    Identity.prototype.set_value = function (value) {
        $(this.htmlElt).find('input').val(this.newValue);
        return $(this.htmlElt).val(value);
    }
    Identity.prototype.get_HtmlId = function () {
        var id;
        if ($(this.htmlElt)[0]) {
            id = $(this.htmlElt)[0].id;
        }
        return id;
    }
    return Identity;
})();
//Patternlet of observer
var Observlet = (function () {
    
    var controller = {};
    var observable = {};
    var publisher = {
        subscribers: {
            any: [] // event type: subscribers    
        },
        subscribe: function (subscriber, type) {
            type = type || 'any';
            if (typeof this.subscribers[type] === "undefined") {
                this.subscribers[type] = [];
            }
            this.subscribers[type].push(subscriber);
        },
        unsubscribe: function (subscriber, type) {
            this.visitSubscribers('unsubscribe', subscriber, type);
        },
        publish: function (observableOuter, publication, type) {
            observable = observableOuter;
            return this.visitSubscribers('publish', publication, type);
        },
        visitSubscribers: function (action, arg, type) {
            
            var validationsAsync = [];
            var success = function (value) {
                if (value && value.htmlElt) { common.writeLog('visitSubscribers succeeded for ' + value.htmlElt.id); }
            };
            var fail = function (value) {
                //TODO: subscribers[i].rollback();
                if (value && value.htmlElt) { common.writeLog('visitSubscribers Failed for ' + value.htmlElt.id); }
            };
            
            var pubtype = type || 'any',
                subscribers = this.subscribers[pubtype],
                i,
                max = subscribers.length;
            
            for (i = 0; i < max; i += 1) {
                if (action === 'publish') {
                    if (subscribers[i].action && typeof subscribers[i].action === "function") {
                        var validationAsync = validator.validation(observable, subscribers[i]);
                        validationAsync.then(success, fail);
                        validationsAsync.push(validationAsync);
                    }
                } else {
                    if (subscribers[i] === arg) {
                        subscribers.splice(i, 1);
                    }
                }
            }
            
            //when all promises are finished successfully resolve in caller.
            return $.when.apply(null, validationsAsync);
        }
    };
    var publisherFactory = function (observableCandidate) {
        var i;
        for (i in publisher) {
            if (publisher.hasOwnProperty(i) && typeof publisher[i] === "function") {
                observableCandidate[i] = publisher[i];
            }
        }
        observableCandidate.subscribers = {
            any: []
        };
    }
    var notified = {};
    var observables = [];
    var saveObservable = function (outerObservable) {
        var unKnown = true;
        var index;
        
        $.each(observables, function (i, innerObservable) {
            if (innerObservable.get_HtmlId() === outerObservable.get_HtmlId()) {
                unKnown = undefined;
                index = i;
            }
        });
        if (unKnown) {
            observables.push(outerObservable);
        } else {
            observables[index] = outerObservable;
        }
    }
    
    var Subscriber = (function (parent) {
        Subscriber.prototype = new System.Identity();
        Subscriber.prototype.constructor = System.Identity;
        function Subscriber(id, htmlElt, name, viewModel, getMessage) {
            parent.call(this, id, htmlElt, name, viewModel, getMessage);
        }
        return Subscriber;
    })(System.Identity);
    
    var Observable = (function (parent) {
        Observable.prototype = new System.Identity();
        Observable.prototype.constructor = System.Identity;
        function Observable(id, htmlElt, name, viewModel, getMessage) {
            parent.call(this, id, htmlElt, name, viewModel, getMessage);
        }
        Observable.prototype.notify = function (value) {
            var deferred = undefined;
            
            this.newValue = value;
            if (this.publish) {
                deferred = this.publish(this, value);
            }
            
            return deferred;
        }
        return Observable;
    })(System.Identity);
    
    var validator = {};
    var getSubscribers = function (observableInner, typeOrName) {
        var subscribers = [];
        
        $.each(observableInner.subscribers.any, function (i, subscriber) {
            if (subscriber.get_type() === typeOrName || subscriber.name === typeOrName) {
                subscribers.push(subscriber);
            }
        });
        return subscribers;
    }
    return {
        controller: controller,
        publisherFactory: publisherFactory,
        publisher: publisher,
        observables: observables,
        saveObservable: saveObservable,
        Subscriber: Subscriber,
        Observable: Observable,
        validator: validator,
        notified: notified,
        get_subscribers: getSubscribers
    }
})(Validator);

System.Observlet = Observlet;
common.System = System;
//In terms of GRASP use pure fabrication for loosely coupling.
common.fabrication = (function ($) {
    var Injector = {
        
        dependencies: {},
        
        process: function () {
            var contextArgs = Array.prototype.slice.call(arguments);
            var controller = contextArgs[0];
            var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
            //var FN_ARG_SPLIT = /,/;
            //var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
            var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var text = controller.toString();
            var args = text.match(FN_ARGS)[1].split(text.match(STRIP_COMMENTS))[0].split(',');
            var arglist = contextArgs.splice(1);
            
            args.forEach(function (arg, i, array) {
                var list = [];
                list.push(arg);
                arglist.unshift(Injector.getDependencies(list).pop());
                controller.apply(controller, arglist);
                arglist.shift();
            });
        },
        
        getDependencies: function (arr) {
            var self = Injector;
            return arr.map(function (value) {
                if (self.dependencies[value]) {
                    return self.dependencies[value];
                } else
                    return value;;
            });
        },
        
        register: function (name, dependency) {
            Injector.dependencies[name] = dependency;
        }

    };
    
    var Persistor = (function () {
        function Persistor() {
            this.create = {};
            this.read = {};
            this.update = {};
            this.delete = {};
        }        ;
        
        return Persistor;
    });
    
    var treeListController = function (TreeListService) {
        //contextargs is an array: [serviceRegistered, context]
        var contextArgs = Array.prototype.slice.call(arguments);
        var serviceRegistered = contextArgs[0];
        var context = contextArgs[1];
        
        if (serviceRegistered.update) {
            serviceRegistered.update.apply(context);
        } else {
            writeErrorLog('TreeListService is not registered :', TreeListService);
        }        ;
    };
    var RepositoryController = (function (parent) {
        //Contains businessdata (HTML5 data-* attributes).
        $(function () {

        });
        
        RepositoryController.prototype = new Persistor();
        RepositoryController.prototype.constructor = Persistor;
        
        var saveSelectedSite = function (dataid, parentid, oldText, newText) {
            var deferred = $.Deferred();
            var myObject = new Object();
            myObject.dataId = dataid;
            myObject.parentId = parentid;
            myObject.oldMappedSiteName = oldText;
            myObject.selectedSiteName = newText;
            
            var devUrl = appPath + "/MapUtilService.asmx/SaveSelectedSite";
            var deploymentUrl = window.shell.getAbsoluteUrl(devUrl);//globals.deploymentUrl(devUrl);
            var succes = function (data) {
                try {
                    
                    writeLog('Saveselected sitename', 'success:', data.d);

                } catch (e) {
                    deferred.rejectWith(this, [e, dataid]);
                }                ;
            };
            var fail = function () {
                deferred.rejectWith(this, [dataid]);
            };
            
            $.when($.ajax({
                type: "POST",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                url: deploymentUrl,
                data: JSON.stringify({ "myObject": myObject })
            })).then(succes, fail);
            
            return deferred.promise();
        };
        //Redundant in  Singleton.
        function RepositoryController() {
            parent.call(this, (function () {
                var name = '';
                return name;
            }));
        }
        
        var save = function () {
            var success = function () {
                writeLog('sitename saved.');
            };
            var failed = function () {
                writeErrorLog(this, arguments);
            };
            writeLog('Saving treelistview action');
            
            saveSelectedSite(this.data.id, this.data.parentid, oldValue, this.newValue);
        };
        var valueChanged = function () {
            initData.apply(this, arguments);
        };
        
        var oldValue;
        var appPath;
        
        var selectedIndexChanging = function () {
            var control = arguments[0];
            oldValue = control.get_text();
        };
        var selectedIndexChanged = function () {
            initData.apply(this, arguments);
        };
        var initData = function () {
            var control = arguments[0];
            var data = $(control.get_element()).data();
            appPath = data.applicationpath;
            
            this.data = data;
            this.newValue = control.get_text();
            
            var args = Array.prototype.slice.call(arguments);
            args.unshift(this);
            args.unshift(treeListController);
            
            Injector.process.apply(this, args);

        };
        
        return {
            update: save,
            valueChanged: valueChanged,
            selectedIndexChanging: selectedIndexChanging,
            selectedIndexChanged: selectedIndexChanged,
            constructor: new RepositoryController().prototype.constructor
        };
    })(Persistor);
    return {
        Injector: Injector,
        Persistor: Persistor,
        RepositoryController: RepositoryController
    }
})(jQuery);
module.exports = common;