var urlPrefix = "http://capitalistparadise.com/nationstates/v1_7/";

function _nationstatesSetup() {
	var pageUrl = window.location.href;

	loadFile(urlPrefix + 'nouislider.fox.css', false);
	loadFile(urlPrefix + 'bootstrap-button.css', false);
	loadFile(urlPrefix + 'two_column.css', false);
	loadFile(urlPrefix + 'nationstates++.css', false);
	if (document.head.innerHTML.indexOf("antiquity") != -1) {
		loadFile(urlPrefix + 'nationstates++_antiquity.css', false);
	}
	loadFile(urlPrefix + 'jquery-ui-1.10.3.custom.min.css', false);
	$(document).ready(function(){
		loadFile(urlPrefix + 'nationstates++_common.js', true);
	});

	if (pageUrl == "http://www.nationstates.net/page=ns++") {
		debugConsole('[NationStates++] Detected NationStates Settings Page. Loading...');

		loadFile(urlPrefix + 'settings.js', true);

		debugConsole('[NationStates++] Loading Completed Successfully.');
	} else if (pageUrl.indexOf('http://www.nationstates.net/') > -1 && isSettingEnabled("region_enhancements")) {
		debugConsole('[NationStates++] Detected NationStates Page. Loading...');

		$(document).ready(function(){
			loadFile(urlPrefix + 'jquery.caret.js', true);
			loadFile(urlPrefix + 'jquery.highlight.js', true);
			loadFile(urlPrefix + 'jquery.nouislider.min.js', true);
			loadFile(urlPrefix + 'nationstates++.js', true);
			if (isSettingEnabled("embassy_flags")) {
				loadFile(urlPrefix + 'embassy_flags.js', true);
			}
		});

		debugConsole('[NationStates++] Loading Completed Successfully.');
	} else if (pageUrl.indexOf('http://forum.nationstates.net/') > -1 ) {
		debugConsole('[NationStates++] Detected NationStates Forum Page. Loading...');
		//forums do not have jQuery
		addJavascript("//ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js");
		addJavascript("//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js");

		if (isSettingEnabled("forum_enhancements")) {
			$(document).ready(function(){
				if (isSettingEnabled("egosearch_ignore")) {
					loadFile(urlPrefix + 'forum_ego_posts.js', true);
				}
				if (isSettingEnabled("post_ids")) {
					console.log("post_ids: " + localStorage.getItem("post_ids"));
					loadFile(urlPrefix + 'forum_post_id.js', true);
				}
			});
		}

		debugConsole('[NationStates++] Loading Completed Successfully.');
	}
};

//Add listener for sending local storage settings
window.addEventListener("message", function(event) {
	// We only accept messages from ourselves
	if (event.source != window)
		return;
	if (event.data.method == "send_all_settings") {
		window.postMessage({method: "all_settings",
							region_enhancements: isSettingEnabled("region_enhancements"), 
							embassy_flags: isSettingEnabled("embassy_flags"),
							search_rmb: isSettingEnabled("search_rmb"), 
							infinite_scroll: isSettingEnabled("infinite_scroll"), 
							show_ignore: isSettingEnabled("show_ignore"), 
							show_quote: isSettingEnabled("show_quote"), 
							auto_update: isSettingEnabled("auto_update"), 
							clickable_links: isSettingEnabled("clickable_links"), 
							forum_enhancements: isSettingEnabled("forum_enhancements"), 
							post_ids: isSettingEnabled("post_ids"), 
							egosearch_ignore: isSettingEnabled("egosearch_ignore"), 
							}, "*");
	} else if (event.data.method == "saving_settings") {
		for (var key in event.data) {
			if (event.data.hasOwnProperty(key) && key != "method") {
				localStorage.setItem(key, event.data[key]);
				var save = new Object();
				save[key] = event.data[key];
				if (typeof chrome != "undefined") {
					chrome.storage.local.set(save);
				}
				console.log("Key: " + key + " value: " + event.data[key]);
			}
		}
		window.postMessage({method: "settings_saved"}, "*");
	}
}, false);

if (typeof chrome != "undefined") {
	chrome.storage.local.get("region_enhancements", syncLocalStorage);
	chrome.storage.local.get("embassy_flags", syncLocalStorage);
	chrome.storage.local.get("search_rmb", syncLocalStorage);
	chrome.storage.local.get("infinite_scroll", syncLocalStorage);
	chrome.storage.local.get("show_ignore", syncLocalStorage);
	chrome.storage.local.get("show_quote", syncLocalStorage);
	chrome.storage.local.get("auto_update", syncLocalStorage);
	chrome.storage.local.get("clickable_links", syncLocalStorage);
	chrome.storage.local.get("forum_enhancements", syncLocalStorage);
	chrome.storage.local.get("egosearch_ignore", syncLocalStorage);
	chrome.storage.local.get("post_ids", syncLocalStorage);
}

function syncLocalStorage(data) {
	for (var key in data) {
		console.log("Syncing: " + key + " to : " + data[key]);
		localStorage.setItem(key, data[key]);
	}
}

function isSettingEnabled(setting) {
	return localStorage.getItem(setting) == null || localStorage.getItem(setting) == "true";
}

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

var _debugMode = false;
function debugConsole(message) {
	if (_debugMode) console.log(message);
}

function loadFile(url, javascript) {
	if (_nationstatesFileSystem) {
		var fileName = url.split('/')[url.split('/').length - 1];
		_nationstatesFileSystem.root.getFile(fileName + ".cache", {create: false}, function(cachedFile) {
			//Check to make sure cache is valid (non-zero file)
			cachedFile.createWriter(function(fileWriter) {	
				if (fileWriter.length != 0) {
					_nationstatesFileSystem.root.getFile(fileName, {create: false}, function(fileEntry) {
					//Remove old file, Move cache file
					fileEntry.remove(function() {
						debugConsole("Removed old file. Moving " + fileName + ".cache to " + fileName);
						cachedFile.moveTo(_nationstatesFileSystem.root, fileName, function() { setupFile(fileName, url, javascript);});
					});
					}, function() {
						//There was no old file, move new file
						debugConsole("Moving " + fileName + ".cache to " + fileName);
						cachedFile.moveTo(_nationstatesFileSystem.root, fileName, function() { setupFile(fileName, url, javascript);});
					});
				} else {
					setupFile(fileName, url, javascript);
					cachedFile.remove(function() { debugConsole("Invalid cache, ignoring"); });
				}
			});
			
		}, function() { setupFile(fileName, url, javascript);});
	} else {
		debugConsole("No FS support, using fallback: " + url);
		loadFallback(url, javascript);
	}
}

function setupFile(fileName, url, javascript) {
	_nationstatesFileSystem.root.getFile(fileName, {create: false}, function(fileEntry) {
		debugConsole("Using cache: " + fileEntry.toURL());
		if (javascript) {
			addJavascript(fileEntry.toURL());
		} else {
			addStylesheet(fileEntry.toURL());
		}
		saveToCache(fileName, url, javascript);
	},
	function() {
		debugConsole("Using fallback: " + url);
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
			saveToCache0(fileName, url, javascript, fileWriter.length);
		});
	}, function() {
		//File does not exist
		saveToCache0(fileName, url, javascript, -1);
	});
}

function saveToCache0(fileName, url, javascript, oldFileSize) {
	debugConsole("saving: " + fileName + " to cache. Previous File Size: " + oldFileSize);
	_nationstatesFileSystem.root.getFile(fileName + ".cache", {create: true}, function(fileEntry) {
		fileEntry.createWriter(function(fileWriter) {

			fileWriter.onerror = function(e) {
				debugConsole('Write failed: ' + e.toString());
				debugConsole(e);
			};
			
			var request = $.ajax({
				url: url,
				dataType: 'text',
				success: function(data) {
					var blob = new Blob([data], {type: (javascript ? 'application/javascript' : 'text/css')});
					debugConsole("Checking if cache is fresh");
					if (blob.size != oldFileSize) {
						debugConsole("Cache is stale, previous: " + oldFileSize + " new: " + blob.size);
						fileWriter.write(blob);
					} else {
						debugConsole("Cache is fresh");
						fileEntry.remove(function() { });
					}
				},
				error: function (request, status, error) { debugConsole(request); debugConsole(status); debugConsole(error);}
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
	debugConsole(e);
	debugConsole('Error: ' + msg);
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