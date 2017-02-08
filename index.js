"use strict";
process.title = 'node-chat';
var webSocketServer = require('websocket').server;

var webSocketsServerPort = 1337;

var http = require('http');

var history = [ ];
var clients = [ ];

var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
colors.sort(function(a,b) { return Math.random() > 0.5; } );

var server = http.createServer();
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
var wsServer = new webSocketServer({
    httpServer: server
});

wsServer.on('request', function(request) {
    console.log('new request opened');
    var connection = request.accept(null, request.origin);
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;

    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    connection.on('message', function(message) {
        console.log('message recieved', message);
        if (userName === false) {
            userName = message.utf8Data;
            userColor = colors.shift();

            connection.sendUTF(JSON.stringify({
                type:'color', data: userColor
            }));
        } else {
            var obj = {
                time: (new Date()).getTime(),
                text: message.utf8Data,
                author: userName,
                color: userColor
            };
            history.push(obj);
            history = history.slice(-100);

            var type = 'message';
            var youtubeEmbed = '';
            var youtubeId = '';
            if(obj.text.includes("youtu")) {
                type = 'youtube';
                youtubeId = extractId(obj.text);
            }
            var json = JSON.stringify({ type: type, data: obj, youtubeId: youtubeId });
            for (var i=0; i < clients.length; i++) {
                clients[i].sendUTF(json);
            }
        }
    });

    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            clients.splice(index, 1);
            colors.push(userColor);
        }
    });

});

function extractId(text) {
    var id = false;
    if (text.includes("youtu.be")) {
        var re = /.*youtu\.be\/+(.*)\s*.*/;
        id = text.replace(re, "$1");
    } else {
        var re = /.*v=+(.*)(&|\s*).*/;
        id = text.replace(re, "$1");
    }
    return id;
}
