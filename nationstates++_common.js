//$("#banner").prepend("<div style='position:absolute; top:0px; right:0; margin:6px 60px 0px 0px; z-index:98; font-weight:bold; font-size:10pt;'></div>");

function setLocalStorage(key, value) {
	localStorage.setItem(key, value);
}

function getLocalStorage(key) {
	return localStorage.getItem(key);
}

function removeLocalStorage(key) {
	return localStorage.removeItem(key);
}

window.addEventListener("message", function(event) {
	if (event.source != window)
		return;
	
}, false);
window.postMessage({ method: "send_all_keys"}, "*");