//versioned files are checked for modifications each page hit (slow)
var urlPrefix = "http://capitalistparadise.com/nationstates/v1_85/";
//static files are cached by browser for 1 week, not checked for modifications (fast)
var staticUrlPrefix = "http://capitalistparadise.com/nationstates/static/";

var pageUrl = window.location.href;

if (pageUrl.indexOf("template-overall=minimal") == -1) {
	setupNationStates();
}

function setupNationStates() {
	//Have to remove this one
	$("#banneradbox").remove();

	if (isSettingEnabled("hide_ads")) {
		$("#paneladbox").remove();
		$("#sidebaradbox").remove();
		$("#footeradbox").remove();
		$("#removead").remove();
		$("#maxad").remove();
		$("#regionadbox").remove();
	}

	var bannerStyle = "position:absolute; top:0px; margin:6px 60px 0px 0px; z-index:98; font-weight:bold; color: white !important; font-weight: bold; font-size: 8pt; padding: 2px 8px 2px 8px; background: black; 	background-color: rgba(0,0,0,0.2); 	border-radius: 8px;";
	if (document.head.innerHTML.indexOf("ns.dark") != -1) {
		bannerStyle += "background: #2A2A2A; border: 1px solid #383838;"
	}

	var banner = $("#banner, #nsbanner");
	$(banner).append("<div id='ns_setting'><a href='javascript:void(0)' style='" + bannerStyle + " right: 78px; ' onclick='return showSettings();'>NS++ Settings</a></div>");
	if (pageUrl.indexOf('http://forum.nationstates.net/') == -1 ) {
		$(banner).append("<div id='puppet_setting' style='display:none;'><a href='javascript:void(0)' style='" + bannerStyle + " right: 188px;' onmouseover='return showPuppets();'>Puppets</a></div>");
	}

	addJavascript("//d3nslu0hdya83q.cloudfront.net/dist/1.0/raven.min.js");
	addJavascript('https://cdn.firebase.com/v0/firebase.js');
	addJavascript('https://cdn.firebase.com/v0/firebase-simple-login.js');

	addStylesheet(staticUrlPrefix + 'nouislider.fox.css');
	addStylesheet(staticUrlPrefix + 'bootstrap-button.css');
	addStylesheet(staticUrlPrefix + 'two_column.css');
	addStylesheet(urlPrefix + 'nationstates++.css');
	if (document.head.innerHTML.indexOf("antiquity") != -1) {
		addStylesheet(urlPrefix + 'nationstates++_antiquity.css');
	} else if (document.head.innerHTML.indexOf("ns.dark") != -1) {
		addStylesheet(urlPrefix + 'nationstates++_dark.css');
	}

	if (document.head.innerHTML.indexOf("//ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js") == -1) {
		addJavascript("//ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js", function() {
			addJavascript("//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js", loadJavascript);
		});
	} else {
		loadJavascript();
	}
}

function loadJavascript() {
	addJavascript(staticUrlPrefix + 'jquery.caret.js');
	addJavascript(staticUrlPrefix + 'jquery.highlight.js');
	addJavascript(staticUrlPrefix + 'jquery.nouislider.min.js');

	addJavascript(urlPrefix + 'nationstates++_common.js', function() {
		if (pageUrl.indexOf('http://www.nationstates.net/') > -1 && isSettingEnabled("region_enhancements")) {
			console.log('[NationStates++] Detected NationStates Page. Loading...');

			if (document.head.innerHTML.indexOf("antiquity") != -1) {
				addStylesheet(staticUrlPrefix + "prefix-ghbuttons_v2.css");
			}

			addJavascript(urlPrefix + 'nationstates.js');
			addJavascript(urlPrefix + 'region.js');
			addJavascript(urlPrefix + 'nation.js');
			
			if (isSettingEnabled("embassy_flags")) {
				addJavascript(urlPrefix + 'embassy_flags.js');
			}
			if (isSettingEnabled("telegram_enhancements")) {
				addJavascript(urlPrefix + 'telegrams.js');
			}
			addJavascript(urlPrefix + 'issues.js');
			addJavascript(urlPrefix + 'help.js');
			addJavascript(urlPrefix + 'irc.js');

			console.log('[NationStates++] Loading Completed Successfully.');
		} else if (pageUrl.indexOf('http://forum.nationstates.net/') > -1 ) {
			console.log('[NationStates++] Detected NationStates Forum Page. Loading...');
			addStylesheet("http://www.nationstates.net/ghbuttons_v2.css");
			addStylesheet(urlPrefix + 'forum.css');

			if (isSettingEnabled("forum_enhancements")) {
				if (isSettingEnabled("egosearch_ignore")) {
					addJavascript(urlPrefix + 'forum_ego_posts.js');
				}
				if (isSettingEnabled("post_ids")) {
					addJavascript(urlPrefix + 'forum_post_id.js');
				}
			}

			console.log('[NationStates++] Loading Completed Successfully.');
		}
	});
}

window.addEventListener("message", function(event) {
	if (event.data.method == "unread_forum_posts") {
		/*$.get("http://forum.nationstates.net/search.php?search_id=egosearch", function(data) {
			var unread = 0;
			$(data).find(".forumbg").find("a").each(function() {
				if ($(this).attr("href") != null && $(this).attr("href").indexOf("#unread") != -1) {
					var postName = "post-" + $(this).parent().parent().find(".topictitle").html();
					var lastDate = localStorage.getItem("post-" + postName);
					if (lastDate == null) {
						localStorage.setItem("post-" + postName, Date.now());
						lastDate = Date.now();
					} else {
						lastDate = parseInt(lastDate);
					}
					if (lastDate + 24 * 60 * 60 * 1000) {
						unread++;
					}
				}
			});
			window.postMessage({ method: "unread_forum_posts_amt", amt: unread}, "*");
		});*/
	}
});

function isSettingEnabled(setting) {
	return localStorage.getItem(setting) == null || localStorage.getItem(setting) == "true";
}

function addStylesheet(url) {
	var style = document.createElement('link');
	style.setAttribute('rel', 'stylesheet');
	style.setAttribute('type', 'text/css');
	style.setAttribute('href', url);
	document.head.appendChild(style);
}

function addJavascript(url, onLoad) {
	var script = document.createElement('script');
	script.src = url;
	var split = url.split("/");
	script.id = split[split.length - 1];
	if (onLoad) {
		script.addEventListener('load', onLoad);
	}
	console.log("Loading [" + script.id + "]");
	document.head.appendChild(script);
}
