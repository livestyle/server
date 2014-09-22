define(function() {
	return {
		'editor-connect': {
			id: 'sample-editor',
			title: 'Sample editor',
			icon: '',
			files: ['/path/to/file1.css', '/path/to/file2.less', '/path/to/file3.scss']
		},
		'editor-disconnect': {
			id: 'sample-editor'
		},
		'editor-files': {
			id: 'sample-editor',
			files: ['/path/to/file1.css', '/path/to/file2.less', '/path/to/file3.scss']
		},
		'initial-content': {
			uri: '/path/to/file1.css',
			syntax: 'css',
			hash: '12345',
			content: 'div {background: yellow}'
		},
		'calculate-diff': {
			uri: '/path/to/file1.css',
			syntax: 'css',
			hash: '12345-2',
			content: 'div {background: blue;color: white;}',
			previous: 'div {background: yellow}'
		},
		'diff': {
			uri: '/path/to/file1.css',
			syntax: 'css',
			patches: [{
				path: [['div', 1]],
				action: 'update', 
				update: [{name: 'color', value: 'blue'}],
				remove: []
			}]
		},
		'apply-patch': {
			uri: '/path/to/file1.css',
			syntax: 'css',
			hash: '12345',
			content: 'div {color: red}',
			patches: [{
				path: [['div', 1]],
				action: 'update', 
				update: [{name: 'color', value: 'blue'}],
				remove: []
			}]
		},
		'patch': {
			uri: '/path/to/file1.css',
			hash: '12345',
			content: 'div {color: blue}',
			ranges: [12, 15, 'blue']
		}
	}
});