var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');
var ws = require('ws');
var chalk = require('chalk');

var clients  = []; // all connected clients
var patchers = []; // clients identified as 'patcher'
var editors  = {}; // clients identified as 'editor'

/**
 * Removes given client from all collections
 * @param  {Websocket} client
 */
function removeClient(client) {
	[clients, patchers].forEach(function(arr) {
		var ix = arr.indexOf(client);
		if (~ix) {
			arr.splice(ix, 1);
		}
	});

	Object.keys(editors).forEach(function(id) {
		if (editors[id] === client) {
			sendMessage(clients, {
				name: 'editor-disconnect',
				data: {id: id}
			});
			delete editors[id];
		}
	});
}

/**
 * Do special processing of incoming messages
 * @param  {Object} payload Message payload (object with `name` and `data` keys)
 * @param  {Websocket} client  Client that sent given message
 */
function handleMessage(message, client) {
	var payload = JSON.parse(message);
	var receivers = clients;
	switch (payload.name) {
		case 'editor-connect':
			editors[payload.data.id] = client;
			break;
		case 'patcher-connect':
			patchers.push(client);
			break;
		case 'calculate-diff':
		case 'apply-patch':
			// These are very heavy and intensive messages
			// that can be only handled by special clients 
			// called 'patchers'. To save some resources and
			// bandwidth it’s recommended to send these
			// messages to patchers only
			receivers = patchers;
			break;
	}

	// Send all incoming messages to all connected clients
	// except current one
	sendMessage(receivers, message, client);
}

/**
 * Sends message to given receivers
 * @param  {Array} receivers List of receivers (websocket clients)
 * @param  {Object} message   Message to send
 * @param  {Websocket|Array} exclude  Exclude given client(s) from receivers
 */
function sendMessage(receivers, message, exclude) {
	if (typeof message !== 'string')  {
		message = JSON.stringify(message);
	}

	if (exclude) {
		if (!Array.isArray(exclude)) {
			exclude = [exclude];
		}
		receivers = receivers.filter(function(client) {
			return !~exclude.indexOf(client);
		});
	}

	receivers.forEach(function(client) {
		client.send(message);
	});
}

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

// Create websocket endpoint
var wsServer = new ws.Server({
	server: server,
	path: '/livestyle'
});

wsServer.on('connection', function(ws) {
	console.log(chalk.bold.blue('Client connected'));
	clients.push(ws);
	ws.on('message', function(message) {
		var parsedMessage = JSON.parse(message);
		console.log(chalk.magenta('→'), chalk.gray('Received message'), chalk.green(parsedMessage.name));
		
		handleMessage(message, ws);
	})
	.on('close', function() {
		console.log(chalk.red('Client disconnected'));
		removeClient(ws);
		sendMessage(clients, {name: 'client-disconnect'}, ws);
	});

	sendMessage(clients, {name: 'client-connect'}, ws);
});

// Listen
server.listen(54000);
var addr = server.address();
console.log('Started LiveStyle server at http://' + addr.address + ':' + addr.port);