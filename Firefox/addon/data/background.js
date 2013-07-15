//versioned files are checked for modifications each page hit (slow)
var urlPrefix = "http://capitalistparadise.com/nationstates/v1_8/";
//static files are cached by browser for 1 week, not checked for modifications (fast)
var staticUrlPrefix = "http://capitalistparadise.com/nationstates/static/";

var pageUrl = window.location.href;

//Have to remove this one
$("#banneradbox").remove();

if (isSettingEnabled("hide_ads")) {
	$("#paneladbox").remove();
	$("#sidebaradbox").remove();
	$("#footeradbox").remove();
	$("#removead").remove();
	$("#maxad").remove();
}

var banner = $("#banner, #nsbanner");
$(banner).append("<div id='ns_setting'><a href='javascript:void(0)' class='ns-settings' onclick='return showSettings();'>NS++ Settings</a></div>");
if (pageUrl.indexOf('http://forum.nationstates.net/') == -1 ) {
	$(banner).append("<div id='puppet_setting'><a href='javascript:void(0)' class='ns-settings' onmouseover='return showPuppets();' style='right: 188px;'>Puppets</a></div>");
}

addJavascript('https://cdn.firebase.com/v0/firebase.js');
addJavascript('https://cdn.firebase.com/v0/firebase-simple-login.js');

addStylesheet("http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css");
addStylesheet(staticUrlPrefix + 'nouislider.fox.css');
addStylesheet(staticUrlPrefix + 'bootstrap-button.css');
addStylesheet(staticUrlPrefix + 'two_column.css');
addStylesheet(urlPrefix + 'nationstates++.css');
if (document.head.innerHTML.indexOf("antiquity") != -1) {
	addStylesheet(urlPrefix + 'nationstates++_antiquity.css');
}
addJavascript(urlPrefix + 'nationstates++_common.js');

if (pageUrl.indexOf('http://www.nationstates.net/') > -1 && isSettingEnabled("region_enhancements")) {
	console.log('[NationStates++] Detected NationStates Page. Loading...');

	if (document.head.innerHTML.indexOf("antiquity") != -1) {
		addStylesheet(staticUrlPrefix + "prefix-ghbuttons_v2.css");
	}

	addJavascript(staticUrlPrefix + 'jquery.caret.js');
	addJavascript(staticUrlPrefix + 'jquery.highlight.js');
	addJavascript(staticUrlPrefix + 'jquery.nouislider.min.js');
	addJavascript(urlPrefix + 'nationstates++.js');
	if (isSettingEnabled("embassy_flags")) {
		addJavascript(urlPrefix + 'embassy_flags.js');
	}
	if (isSettingEnabled("telegram_enhancements")) {
		addJavascript(urlPrefix + 'telegrams.js');
	}
	addJavascript(urlPrefix + 'issues.js');
	addJavascript(urlPrefix + 'help.js');

	console.log('[NationStates++] Loading Completed Successfully.');
} else if (pageUrl.indexOf('http://forum.nationstates.net/') > -1 ) {
	console.log('[NationStates++] Detected NationStates Forum Page. Loading...');
	//forums do not have jQuery
	addJavascript("//ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js");
	addJavascript("//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js");
	addStylesheet("http://www.nationstates.net/ghbuttons_v2.css");
	addStylesheet(urlPrefix + 'forum.css');


	if (isSettingEnabled("forum_enhancements")) {
		if (isSettingEnabled("egosearch_ignore")) {
			addJavascript(urlPrefix + 'forum_ego_posts.js');
		}
		if (isSettingEnabled("post_ids")) {
			console.log("post_ids: " + localStorage.getItem("post_ids"));
			addJavascript(urlPrefix + 'forum_post_id.js');
		}
	}

	console.log('[NationStates++] Loading Completed Successfully.');
}

$.get("http://www.nationstates.net/page=compose_telegram", function(data) {
	console.log("loaded telegrams compose");
});

function isSettingEnabled(setting) {
	return localStorage.getItem(setting) == null || localStorage.getItem(setting) == "true";
}

var _debugMode = false;
function debugConsole(message) {
	if (_debugMode) console.log(message);
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
	var split = url.split("/");
	script.id = split[split.length - 1];
	script.addEventListener('load', function() { });
	document.head.appendChild(script);
}
