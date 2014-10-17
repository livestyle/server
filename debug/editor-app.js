define(function(require) {
	var client = require('./livestyle-client/index');
	var CodeMirror = require('./codemirror/codemirror');
	var cssMode = require('./codemirror/css');
	var crc32 = require('./crc32');

	var lockUpdates = false;
	var editorId = 'demo';
	var currentFile = {
		uri: '/demo/sample.less',
		syntax: 'less'
	};
	var dependencies = {
		'/demo/global.less': '@a: 1; @b: 2;',
		'/demo/mixin.less': '.mixin(@value: 10px) {padding: @value;}'
	};

	function identify() {
		console.log('Identify');
		client.send('editor-connect', {
			id: editorId,
			title: 'Demo editor'
		})
		.send('editor-files', {
			id: editorId,
			files: [currentFile.uri]
		});
	}

	function editorPayload(data) {
		var result = {
			uri: currentFile.uri,
			syntax: currentFile.syntax,
			hash: hash(),
			content: editor.getValue(),
			globalDependencies: ['/demo/global.less']
		};
		if (data) {
			Object.keys(data).forEach(function(key) {
				result[key] = data[key];
			});
		}
		return result;
	}

	function hash(content) {
		return crc32(content || editor.getValue());
	}

	var editor = CodeMirror.fromTextArea(document.querySelector('textarea'), {
		mode: 'text/x-less',
		indentWithTabs: true
	});
	editor.on('change', function() {
		if (lockUpdates) {
			return;
		}
		console.log('perform diff');
		client.send('calculate-diff', editorPayload());
	});

	client.connect()
	.on('open client-connect', function() {
		// tell all clients that editor is connected
		console.log('Connected to server');
		identify();
		client.send('initial-content', editorPayload());
	})
	.on('incoming-updates', function(data) {
		// Handle incoming update: user changes associates browser
		// stylesheet
		if (data.uri === currentFile.uri) {
			console.log('request patch');
			client.send('apply-patch', editorPayload({
				patches: data.patches
			}));
		}
	})
	.on('patch', function(data) {
		if (data.uri === currentFile.uri) {
			// Handle requested patch
			console.log('apply patch');
			lockUpdates = true;
			if (data.hash === hash() && data.ranages) {
				// integrity check: editor content didn’t changed
				// since last patch request so we can apply incremental updates
				cm.operation(function() {
					data.ranges.forEach(function(range) {
						editor.replaceRange(range[2], editor.posFromIndex(range[0]), editor.posFromIndex(range[1]));
					});
				});
			} else {
				// user changed content since last patch request:
				// replace whole content
				editor.setValue(data.content);
			}
			lockUpdates = false;
		}
	})
	.on('request-files', function(data) {
		console.log('Requested dependencies', data.files);
		var response = [];
		data.files.forEach(function(file) {
			if (file.uri in dependencies) {
				response.push({
					uri: file.uri,
					content: dependencies[file.uri],
					hash: hash(dependencies[file.uri])
				});
			}
		});
		console.log('Respond with', response);
		client.send('files', {
			token: data.token,
			files: response
		});
	})
	.on('close', function() {
		clent.send('editor-disconnect', {id: editorId});
	});
});