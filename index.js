var http = require('http');
var express = require('express');
var ws = require('ws');

var app = express();
app.use(express.static(__dirname + '/static'));

var server = http.createServer(app);
var wsServer = new ws.Server({
	server: server,
	path: '/livestyle'
});

wsServer.on('connection', function(ws) {
	console.log('Client connected');
});

server.listen(8005);
console.log('Created server on port 8005');