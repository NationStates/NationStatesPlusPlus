function _nationstatesSetup() {
	if (window.location.href.indexOf('http://www.nationstates.net/region=') > -1) {
		console.log('[NationStates++] Detected Region Page. Loading...');
		//Add commons js
		loadFile('https://dl.dropboxusercontent.com/u/49805/nationstates%2B%2B_common.js', true);

		// Add jquery.caret script
		loadFile('http://capitalistparadise.com/nationstates/v1_5/jquery.caret.js', true);

		// Add jquery.highlight script
		loadFile('http://capitalistparadise.com/nationstates/v1_5/jquery.highlight.js', true);

		// Add css stylesheet
		loadFile('http://capitalistparadise.com/nationstates/v1_5/bootstrap-button.css', false);

		// Add jquery no ui slider css
		loadFile('http://capitalistparadise.com/nationstates/v1_5/nouislider.fox.css', false);

		// Add jquery no ui slider
		loadFile('http://capitalistparadise.com/nationstates/v1_5/jquery.nouislider.min.js', true);

		// Add css stylesheet
		loadFile('https://dl.dropboxusercontent.com/u/49805/two_column.css', false);

		// Add NationStates++ script
		loadFile('https://dl.dropboxusercontent.com/u/49805/nationstates%2B%2B_dev.js', true, 500);

		console.log('[NationStates++] Loading Completed Successfully.');
	} else if (window.location.href.indexOf('http://forum.nationstates.net/') > -1) {
		console.log('[NationStates++] Detected Forum Page. Loading...');
		//Add commons js
		loadFile('https://dl.dropboxusercontent.com/u/49805/nationstates%2B%2B_common.js', true);

		//Forums do not have Jquery, use the same exact CDN the main site uses so it is cached
		addJavascript('//ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js');

		// Add css stylesheet
		loadFile('http://capitalistparadise.com/nationstates/v1_5/bootstrap-button.css', false);

		loadFile('https://dl.dropboxusercontent.com/u/49805/nationstates%2B%2B_forum.js', true);
		console.log('[NationStates++] Loading Completed Successfully.');
	}
};

window.addEventListener("message", function(event) {
	// We only accept messages from ourselves
	if (event.source != window)
		return;
	console.log("Content script received: " + event.data.method);
}, false);

//Chrome is strange
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
if (window.File && window.FileReader && window.FileList && window.Blob && window.requestFileSystem) {
	//run during event handler
	window.requestFileSystem(window.TEMPORARY, 5*1024*1024 /*5MB*/, onInitFs, filesystemError);
} else {
	//fallback
	_nationstatesSetup();
}

var _nationstatesFileSystem;
function onInitFs(fs) {
	_nationstatesFileSystem = fs;
	_nationstatesSetup();
}

function loadFile(url, javascript, fallbackDelay) {
	if (_nationstatesFileSystem) {
		var fileName = url.split('/')[url.split('/').length - 1];
		_nationstatesFileSystem.root.getFile(fileName + ".cache", {create: false}, function(cachedFile) {
			_nationstatesFileSystem.root.getFile(fileName, {create: false}, function(fileEntry) {
				//Remove old file, Move cache file
				fileEntry.remove(function() {
					console.log("Removed old file. Moving " + fileName + ".cache to " + fileName);
					cachedFile.moveTo(_nationstatesFileSystem.root, fileName, function() { setupFile(fileName, url, javascript);});
				});
			}, function() {
				//There was no old file, move new file
				console.log("Moving " + fileName + ".cache to " + fileName);
				cachedFile.moveTo(_nationstatesFileSystem.root, fileName, function() { setupFile(fileName, url, javascript);});
			});
		}, function() { setupFile(fileName, url, javascript);});
	} else {
		console.log("No FS support, using fallback: " + url);
		if (fallbackDelay) {
			setTimeout(function() { loadFallback(url, javascript); }, fallbackDelay);
		} else {
			loadFallback(url, javascript);
		}
	}
}

function setupFile(fileName, url, javascript) {
	_nationstatesFileSystem.root.getFile(fileName, {create: false}, function(fileEntry) {
		console.log("Using cache: " + fileEntry.toURL());
		if (javascript) {
			addJavascript(fileEntry.toURL());
		} else {
			addStylesheet(fileEntry.toURL());
		}
		saveToCache(fileName, url, javascript);
	},
	function() {
		console.log("Using fallback: " + url);
		loadFallback(url, javascript);
		saveToCache(fileName, url, javascript);
	});
}

function loadFallback(url, javascript) {
	if (javascript) {
		addJavascript(url);
	} else {
		addStylesheet(url);
	}
}

function saveToCache(fileName, url, javascript) {
	_nationstatesFileSystem.root.getFile(fileName, {create: false}, function(fileEntry) {
		//File exists, pass along file length
		fileEntry.createWriter(function(fileWriter) {	
			console.log("file size for " + fileName + " is " + fileWriter.length);
			saveToCache0(fileName, url, javascript, fileWriter.length);
		});
	}, function() {
		//File does not exist
		saveToCache0(fileName, url, javascript, -1);
	});
}

function saveToCache0(fileName, url, javascript, oldFileSize) {
	_nationstatesFileSystem.root.getFile(fileName + ".cache", {create: true}, function(fileEntry) {
		fileEntry.createWriter(function(fileWriter) {

			fileWriter.onerror = function(e) {
				console.log('Write failed: ' + e.toString());
			};
			
			console.log("reading " + (javascript ? "javascript" : "css stylesheet"));
			var request = $.ajax({
				url: url,
				dataType: 'text',
				success: function(data) {
					var blob = new Blob([data], {type: (javascript ? 'application/javascript' : 'text/css')});
					console.log("Blob len: " + blob.size + " file len: " + oldFileSize);
					if (blob.size != oldFileSize) {
						fileWriter.write(blob);
					} else {
						fileEntry.remove(function() { });
					}
				},
				error: function (request, status, error) { console.log(request); console.log(status); console.log(error);}
			});
		}, errorHandler);
	}, errorHandler);
}

function filesystemError(e) {
	errorHandler(e);
	_nationstatesSetup();
}

function errorHandler(e) {
	var msg = '';

	switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
			msg = 'QUOTA_EXCEEDED_ERR';
			break;
		case FileError.NOT_FOUND_ERR:
			msg = 'NOT_FOUND_ERR';
			break;
		case FileError.SECURITY_ERR:
			msg = 'SECURITY_ERR';
			break;
		case FileError.INVALID_MODIFICATION_ERR:
			msg = 'INVALID_MODIFICATION_ERR';
			break;
		case FileError.INVALID_STATE_ERR:
			msg = 'INVALID_STATE_ERR';
			break;
		default:
			msg = 'Unknown Error';
			break;
	};
	console.log(e);
	console.log('Error: ' + msg);
}

function addStylesheet(url) {
	var style = document.createElement('link');
	style.setAttribute('rel', 'stylesheet');
	style.setAttribute('type', 'text/css');
	style.setAttribute('href', url);
	document.head.appendChild(style);
}

function addJavascript(url) {
	var script = document.createElement('script');
	script.src = url;
	script.addEventListener('load', function() { });
	document.head.appendChild(script);
}