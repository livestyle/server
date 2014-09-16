var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');
var ws = require('ws');
var chalk = require('chalk');

var clientPool = [];
var patcherPool = [];

// Serve static files
var serveDebug = serveStatic(__dirname + '/debug');
var serveNodeModules = serveStatic(__dirname + '/node_modules');

// Create server
var server = http.createServer(function(req, res) {
	var done = finalhandler(req, res);
	serveDebug(req, res, function(err) {
		serveNodeModules(req, res, done);
	});
})

var wsServer = new ws.Server({
	server: server,
	path: '/livestyle'
});

wsServer.on('connection', function(ws) {
	console.log(chalk.bold.blue('Client connected'));
	clientPool.push(ws);
	ws.on('message', function(message) {
		// TODO handle patcher messages
		
		var parsedMessage = JSON.parse(message);
		console.log(chalk.magenta('→'), chalk.gray('Received message'), chalk.green(parsedMessage.name));
		
		// Send all incoming messages to all connected clients
		// except current one
		clientPool.forEach(function(client) {
			if (client !== ws) {
				client.send(message);
			}
		})
	})
	.on('close', function() {
		console.log(chalk.red('Closed connection'));
		// remove current client from pools
		var ix = clientPool.indexOf(ws);
		if (~ix) {
			clientPool.splice(ix, 1);
		}

		ix = patcherPool.indexOf(ws);
		if (~ix) {
			patcherPool.splice(ix, 1);
		}
	});
});

// Listen
server.listen(54001);
var addr = server.address();
console.log('Started LiveStyle server at http://' + addr.address + ':' + addr.port);