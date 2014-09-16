define(function(require) {
	var client = require('./livestyle-client/index');
	var samples = require('./samples');
	var CodeMirror = require('./codemirror/codemirror');
	var jsMode = require('./codemirror/javascript');

	function setupSamples(container, messageField, editor) {
		container.innerHTML = Object.keys(samples).map(function(name) {
			return '<li>' + name + '</li>';
		}).join('\n');

		container.addEventListener('click', function(evt) {
			if (evt.target.nodeName !== 'LI') {
				return;
			}

			var key = evt.target.innerText;
			var sample = samples[key];
			if (sample) {
				messageField.value = key;
				editor.setValue(JSON.stringify(sample, null, '\t'));
			}
		});
	}

	function setupForm(form, messageField, editor) {
		form.addEventListener('submit', function(evt) {
			evt.preventDefault();
			var message = messageField.value;
			var payload = JSON.parse(editor.getValue() || '{}');
			if (message) {
				console.log('Sending message %c%s %o', 'font-weight:bold', message, payload);
				client.send(message, payload);
			} else {
				console.warn('No message specified');
			}
		});
	}

	client.connect({port: 54001})
		.on('connect', function() {
			console.info('Socket connected');
		})
		.on('message-receive', function(name, payload) {
			console.log('Received message %c%s: %o', 'font-weight:bold;color:green', name, payload);
		})
		.on('disconnect', function() {
			console.warn('Socket disconnected');
		});

	var messageField = document.querySelector('input[name="message"]');
	var editor = CodeMirror.fromTextArea(document.querySelector('textarea'), {
		mode:  'javascript',
		indentWithTabs: true
	});

	setupSamples(document.querySelector('.samples'), messageField, editor);
	setupForm(document.querySelector('form'), messageField, editor);
});