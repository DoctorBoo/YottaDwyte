/// <reference path="_references.js" />
/// <reference path="gps.js" />

(function($, window, document) {
    var watchId = 0;
    // The $ is now locally scoped 
    // Listen for the jQuery ready event on the document
    $(function() {
        console.log('doc ready');
        $.event.props.push("dataTransfer");

        $('#btnAdd').on('click', addNumbersClean);
        $('#btnSubtract').on('click', subtractNumbers);
        $('#btnMultiplication').on('click', multiplyNumbers);
        $('#btnDivision').on('click', divideNumbers);

        $('#target').on('dragenter', preventDefault);
        $('#target').on('dragover', preventDefault);
        $('#target').on('drop', dropItem);
        if (checkSupported()) {
            connect();
            $('#btnSend').click(doSend);
        }

        getLocation();
    });

    function dropItem(e) {
        var files = e.dataTransfer.files,
            $table = $('#fileInfo'),
            i = 0;
        $table.html(
            '<thead><tr><th>Name</th><th>Type</th><th>Size</th></tr></thead>');
        for (i = 0; i < files.length; i++) {
            $('<tr><td>'
                + files[i].name + '</td><td>'
                + files[i].type + '</td><td>'
                + files[i].size + '</td></tr>').appendTo($table);
        }
        preventDefault(e);
    }

    function preventDefault(e) {
        e.preventDefault();
    }

    function addNumbersClean() {
        var data = getFormData();
        serverAddition(data).done(displayResult).fail(displayError);
        console.log('addNumbersClean done.');
    }

    function getFormData() {
        var x = $('#x').val();
        var y = $('#y').val();
        return { "x": x, "y": y };
    }

    function serverAddition(data) {
        return $.getJSON('/addition', data);
    }

    function displayResult(serverData) {
        $('#result').html(serverData.result);
    }

//function subtractNumbers() {
    //    var x = $('#x').val();
    //    var y = $('#y').val();
    //    var data = { "x": x, "y": y };
    //    $.post('/subtraction', data, function (data) {
    //        $('#result').html(data.result);
    //    }, 'json');
    //}
    function subtractNumbers() {
        var data = getFormData();
        serverSubtraction(data).done(displayResult);
        console.log('subtractNumbers done.');
    }

    function serverSubtraction(data) {
        return $.post('/subtraction', data, 'json');
    }

    function multiplyNumbersObs() {
        var x = $('#x').val();
        var y = $('#y').val();
        var data = { "x": x, "y": y };
        $.ajax({
            url: '/multiply',
            data: data,
            type: 'PUT',
            dataType: 'json',
            cache: false,
            success: function(data) {
                $('#result').html(data.result);
            }
        });
    }

    function multiplyNumbers() {
        var data = getFormData();
        serverMultiplication(data).done(displayResult);
        console.log('serverMultiplication done.');
    }

    function serverMultiplication(data) {
        return $.ajax({
            url: '/multiply',
            data: data,
            type: 'PUT',
            dataType: 'json',
            cache: false
        });
    }

    function serverMultiplicationObs(data) {
        console.log('serverMultiplicationObs ...');
        return $.ajax({
            url: '/multiply',
            data: data,
            type: 'PUT',
            dataType: 'json',
            cache: false
        });
    }

    function divideNumbers() {
        var data = getFormData();
        serverDivision(data).done(displayResult).fail(displayError);
    }

    function serverDivision(data) {
        return $.ajax({
            url: '/divide',
            data: data,
            type: 'DELETE',
            dataType: 'json',
            cache: false
        });
    }

    function divideNumbersObs() {
        var x = $('#x').val();
        var y = $('#y').val();
        var data = { "x": x, "y": y };
        $.ajax({
            url: '/divide',
            data: data,
            type: 'DELETE',
            dataType: 'json',
            cache: false,
            success: function(data) {
                $('#result').html(data.result);
            }
        });
    }

    function addNumbersJSON() {
        var x = $('#x').val();
        var y = $('#y').val();
        var data = { "x": x, "y": y };
        $.getJSON('/addition', data, function(data) {
            $('#result').html(data.result);
        });
        console.log('addnumbersJSON done.');
    }

    function addNumbersExt() {
        var x = $('#x').val();
        var y = $('#y').val();
        var data = { "x": x, "y": y };
        $.ajax({
            url: '/addition',
            data: data,
            type: 'GET',
            cache: false,
            dataType: 'json',
            success: function(data) {
                $('#result').html(data.result);
            }
        });
        console.log('addnumbersExt done.');
    }

    function addNumbersObs() {
        var x = document.getElementById('x').value;
        var y = document.getElementById('y').value;
        var result = document.getElementById('result');
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                var jsonObject = JSON.parse(xmlhttp.response);
                result.innerHTML = jsonObject.result;
            }
        };
        xmlhttp.addEventListener("progress", updateProgress, false);
        xmlhttp.addEventListener("error", failed, false);
        xmlhttp.addEventListener("abort", canceled, false);

        xmlhttp.open("GET", "/addition?x=" + x + "&y=" + y, true); //use true  for async usage
        xmlhttp.send();
        //xmlhttp.open("GET", "/addition?x=" + x + "&y=" + y, false);
        //xmlhttp.send();
        //var jsonObject = JSON.parse(xmlhttp.response);
        //result.innerHTML = jsonObject.result;
        console.log('addnumbersObs done.');
    }

    function updateProgress(evt) {
        if (evt.lengthComputable) {
            var percentComplete = evt.loaded / evt.total;
            //display percenComplete
        } else {
            // Need total size to compute progress
        }
    }

    function failed(evt) {
        console.log("Error occured.");
    }

    function canceled(evt) {
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
        webSocket.onopen = function(evt) { onOpen(evt) };
        webSocket.onclose = function(evt) { onClose(evt) };
        webSocket.onmessage = function(evt) { onMessage(evt) };
        webSocket.onerror = function(evt) { onError(evt) };
    }

    function doSend() {

        if (webSocket.readyState != webSocket.OPEN) {
            writeOutput("NOT OPEN: " + $('#txtMessage').val());
            return;
        }

        var table = $('#txtMessage').val();
        $.getJSON('/tree/list/query', table)
            .done(function(serverData) {
                writeOutput("query result:" + serverData['query-result']);
            })
            .fail(function(serverData, error)
            {
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
}(window.jQuery, window, document));