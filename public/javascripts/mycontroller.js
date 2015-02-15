var System = System || {};
var sigma = sigma || null;

var common = (function ($, window, document, undefined) {
  var verboseMode = true;
  var self;
  
  $(function () {
    //console.log('doc ready');
    init();
  });
  
  
  var init = function () {
    self = common;
    self.clicks = self.clicks || [];
    
    $('#menu').hover(
      function () {
        $(this).show();
      }, function () {
        $(this).hide();
      }
    );
    $('#details').on("click", function () {
      $(self.sender).show();      
    });

    $('#neighbours').on("click", function () {
      var db = new sigma.plugins.neighborhoods();
      db.load('/tree/graph/json?dependencies', function () {
        var nodeId = self.nodeId;
        self.sigma.graph.clear();
        var neighbours = db.neighborhood(nodeId);
        self.sigma.graph.read(neighbours);
        self.sigma.refresh();
      });
    });
    $(".node.dialog").dblclick(function () {
      this.remove();
    });
    $('#glyphiconified .glyphicon-refresh').on("click", function () {
      self.graph = self.graph || $('#container').data().graph;
      self.sigma.graph.clear();
      self.sigma.graph.read(self.graph);
      self.sigma.refresh();
    });
    $.ajaxSetup({
      error: function (x, e) {
        if (x.status == 0) {
          self.writeErrorLog('You were disconnected from the server.\n Please check your networkconnection and server online status.');
        } else if (x.status == 404) {
          self.writeErrorLog('Requested URL not found.');
        } else if (x.status == 500) {
          self.writeErrorLog('Internel Server Error.');
        } else if (e == 'parsererror') {
          self.writeLog('Warning.\nParsing JSON Request failed. *************');
        } else if (e == 'timeout') {
          self.writeErrorLog('Request Time out.');
        } else {
          self.writeErrorLog('Unknow Error:\t' + x.responseText);
        }
      }
    });
    
    $(document).ajaxStart(function () {
      self.writeLog("Triggered ajaxStart handler.");
      self.clicks.forEach(function (sender) {
        if (self.sender === sender) {
          //handle each content for a clicked node.
          var $iframe = $(sender + '> iframe');
          var doc = $iframe[0].contentWindow.document;
          var $body = $('body', doc);
          $body.html('<h1>Loading...</h1>');
          $(sender).hide();
        }
      });

    });
    $(document).ajaxComplete(function (event, request, settings) {
      self.writeLog('Request Complete.');
      $('.node').addClass('dialog');
    });
    $.event.props.push("dataTransfer");
    
    //websocket check
    if (checkSupported()) {
      connect();
      $('#btnSend').click(doSend);
    }
    
    
    if (sigma) {
      var graph = $('#container').data().graph;
      var s,
          g = {
            nodes: graph.nodes,
            edges: graph.edges,
            defaultedgetype: 'directed'
          };
      
      s = new sigma({
        graph: g,
        renderer: {
          container: document.getElementById('graph-container'),
          type: 'canvas'
        },
        settings: {
          doubleClickEnabled: false,
          minEdgeSize: 0.5,
          maxEdgeSize: 4,
          enableEdgeHovering: true,
          edgeHoverColor: 'edge',
          defaultEdgeHoverColor: '#000',
          edgeHoverSizeRatio: 1,
          edgeHoverExtremities: true,
        }
      });
      self.sigma = s;
      // Bind the events:
      s.bind('overNode outNode clickNode doubleClickNode rightClickNode', function (e) {
        try {
          console.log(e.type, e.data.node.id, e.data.node.label, e.data.captor);
        } catch (e) {
          
        };
        if (e.type === 'clickNode') {
          var newDialogCss = {
            top: e.data.captor.clientY - 20,
            left: e.data.captor.clientX,
            position: 'absolute',
            visibility: 'visible',
            'z-index': 3001
          };
          var newiFrameCss = {
            position: 'relative',
            visibility: 'visible',
            'z-index': 3001
          };
          $("#menu").menu();
          $('#menu').css(newDialogCss);
          $('#menu').show();
          
          var idSearch = e.data.node.id.replace('.', '\\.');
          var newElement, idElement;
          idElement = '#' + idSearch;
          $('#' + idSearch).remove();
          newElement = document.createElement("iframe");
          $(newElement).attr('id', e.data.node.id);
          $(newElement).attr('class', 'nodeclicked');
          $(newElement).css(newiFrameCss);
          //$('#dialogs')[0].appendChild(newElement);
          var divId = 'dialog-' + e.data.node.id;
          var divDialogSearchable = '#dialog-' + idSearch;
          $(divDialogSearchable).remove();
          $('#dialogs').append('<div id="' + divId + '" class="dialog startAjax"></span></div>');
          $(divDialogSearchable).hide();
          $(divDialogSearchable).css(newDialogCss);
          
          $(divDialogSearchable)[0].appendChild(newElement);
          $(divDialogSearchable).append('<span class="glyphicon glyphicon-remove-circle" aria-hidden="true">');
          
          $('.glyphicon-remove-circle').bind("click", function () {
            $(this).parent().remove();
            self.clicks.splice(self.clicks.indexOf(divDialogSearchable), 1);
          });
          
          var table = e.data.node.id;
          self.sender = divDialogSearchable;
          self.clicks.push(self.sender);
          self.nodeId = e.data.node.id;
          $.get("/tree/list/query", 'table=' + table + '&tablify')
                        .done(function (data) {
            try {
              //var doc = $('#menu')[0].contentWindow.document;
              var doc = $('#' + idSearch)[0].contentWindow.document;
              var $body = $('body', doc);
              var content = $(data)[7];
              $body.html(content);
              
              divDialogSearchable = '#dialog-' + idSearch;
              var found = self.clicks.some(function (sender) {
                return sender === divDialogSearchable;
              });
              if (!found) $(divDialogSearchable).hide();     
            } catch (e) {
              console.log(e);
            }
          })
          .fail(function (data, error) {
            writeOutput("error result:" + serverData.responseText);
            writeOutput("error result:" + error);
          });
                        
        }
      });
      s.bind('overEdge outEdge clickEdge doubleClickEdge rightClickEdge', function (e) {
        console.log(e.type, e.data.edge, e.data.captor);

      });
      s.bind('clickStage', function (e) {
        console.log(e.type, e.data.captor);
        $('.node').trigger('click');
                //var idSearch = e.data.node.id.replace('.', '\\.');
                //var idElement;
                //idElement = '#' + idSearch;
                //$(idElement).trigger("click");
      });
      s.bind('doubleClickStage rightClickStage', function (e) {
        console.log(e.type, e.data.captor);
      });
    }
  }
  
  function preventDefault(e) {
    e.preventDefault();
  }
  
  function failed(e) {
    console.log("Error occured.");
  }
  
  function canceled(e) {
    console.log("Canceled by user.");
  }
  
  function displayError(serverData, error) {
    var value = 'No result.....';
    if ('result' in serverData) value = serverData.result;
    $('#result').html(value + ' - ' + error);
  }
  
  /*
        WEBSOCKET
    */
    var wsUri = 'ws://echo.websocket.org/';
  var webSocket;
  
  function writeOutput(message) {
    var output = $("#divOutput");
    output.html(output.html() + '<br />' + message);
  }
  
  function checkSupported() {
    if (window.WebSocket) {
      writeOutput('WebSockets supported!');
      return true;
    } else {
      writeOutput('WebSockets NOT supported');
      $('#btnSend').attr('disabled', 'disabled');
      return false;
    }
  }
  
  function connect() {
    webSocket = new WebSocket(wsUri);
    webSocket.onopen = function (evt) { onOpen(evt) };
    webSocket.onclose = function (evt) { onClose(evt) };
    webSocket.onmessage = function (evt) { onMessage(evt) };
    webSocket.onerror = function (evt) { onError(evt) };
  }
  
  function doSend() {
    
    if (webSocket.readyState != webSocket.OPEN) {
      writeOutput("NOT OPEN: " + $('#txtMessage').val());
      return;
    }
    
    var table = $('#txtMessage').val();
    //$.getJSON('/tree/list/query', table)
    //    .done(function (serverData) {
    //    writeOutput("query result:" + serverData['query-result']);
    //})
    //    .fail(function (serverData, error) {
    //    writeOutput("error result:" + serverData.responseText);
    //    writeOutput("error result:" + error);
    //});
    $.get("/tree/list/query", table)
            .done(function (data) {
      var output = $("#divOutput");
      output.html(data);
    })
            .fail(function (data, error) {
      writeOutput("error result:" + serverData.responseText);
      writeOutput("error result:" + error);
    });
    writeOutput("SENT: " + $('#txtMessage').val());
    webSocket.send($('#txtMessage').val());
  }
  function onOpen(evt) {
    writeOutput("CONNECTED");
  }
  function onClose(evt) {
    writeOutput("DISCONNECTED");
  }
  function onMessage(evt) {
    writeOutput('RESPONSE: ' + evt.data);
  }
  
  function onError(evt) {
    writeOutput('ERROR: ' + evt.data);
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
}(window.jQuery, window, document));

//Create System.Collection namespace
common.extend(System, 'Collections');

System = System || { Collections: {} };
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
  }  ;
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
  List.prototype.getItemAsync = function (that) {
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
    var task = function () {
      return found;
    };
    if (found) {
      var newTask = function () {
        found = window.$find(found.value) || found.value || found;
        found.value = found;
        return found;
      };
      task = newTask;
            //setTimeout(task, 1);            
            //task();
    }
    return $.wait(task());
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