
//versioned files are checked for modifications each page hit (slow)
var urlPrefix = "http://direct.capitalistparadise.com/nationstates/v2_1/";
//static files are cached by browser for 1 week, not checked for modifications (fast)
var staticUrlPrefix = "http://direct.capitalistparadise.com/nationstates/static/";

var pageUrl = window.location.href;

$.get(urlPrefix + "cache_buster.txt?time=" + Date.now() , function(value) {
	var cacheBuster = localStorage.getItem("cache_buster");
	if (value != cacheBuster) {
		localStorage.setItem("cache_buster", value);
	}
});

(function() {
	var pageUrl = window.location.href;
	if (pageUrl.indexOf("template-overall=none") != -1) {
		return;
	}
	
	$("#banneradbox").remove();
	var settings = localStorage.getItem("settings")
	if (settings == null || settings.indexOf('"hide_ads":false') == -1) {
		$("#paneladbox").remove();
		$("#sidebaradbox").remove();
		$("#footeradbox").remove();
		$("#removead").remove();
		$("#maxad").remove();
		$("#regionadbox").remove();
		$("#dilemmasadbox").remove();
		$("#google_image_div").remove();
		$("iframe[name='google_osd_static_frame']").remove();
		$("#panelad").remove();
	}

	if (localStorage.getItem("ignore_theme_warning") != "true" && $("#outdated").length == 0) {
		if (document.head.innerHTML.indexOf("antiquity") != -1) {
			$("#main").prepend("<div id='outdated' style='height: 60px; width: 100%; background-image: linear-gradient(-45deg, rgba(255, 255, 0, 1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 0, 1) 50%, rgba(255, 255, 0, 1) 75%, transparent 75%, transparent); background-color: #F00; background-size: 50px 50px;font-size: 56px;font-family: impact;text-align: center;'><a style='color: black;' href='javascript:void(0)' id='fix_theme'>NationStates++ Does Not Support The Antiquity Theme</a></div>");
		} else if ($(".shiny.rmbtable").length != 0) {
			$("#content").prepend("<div id='outdated' style='height: 60px; width: 100%; background-image: linear-gradient(-45deg, rgba(255, 255, 0, 1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 0, 1) 50%, rgba(255, 255, 0, 1) 75%, transparent 75%, transparent); background-color: #F00; background-size: 50px 50px;font-size: 56px;font-family: impact;text-align: center;'><a style='color: black;' href='javascript:void(0)' id='fix_theme'>NationStates++ Does Not Support The Century Theme</a></div>");
		}
		if ($(".shiny.rmbtable").length != 0 || document.head.innerHTML.indexOf("antiquity") != -1) {
			$("#fix_theme").on("click", function(event) {
				event.preventDefault();
				$.get("http://www.nationstates.net/page=settings", function(html) {
					var localid = $(html).find("input[name='localid']").val();
					$.post("http://www.nationstates.net/page=settings", "localid=" + localid + "&newtheme=default&update=+Update+", function(data) {
						location.reload();
					});
				});
			});
			return;
		}
	}

	if ($("#ns_setting").length == 0) {
		var bannerStyle = "position:absolute; top:0px; margin:6px 60px 0px 0px; z-index:98; font-weight:bold; color: white !important; font-weight: bold; font-size: 8pt; padding: 2px 8px 2px 8px; background: black; 	background-color: rgba(0,0,0,0.2); 	border-radius: 8px;";
		if (document.head.innerHTML.indexOf("ns.dark") != -1) {
			bannerStyle += "background: #2A2A2A; border: 1px solid #383838;"
		}

		if (pageUrl.indexOf("hideBanner=true") != -1) {
			$("#banner").hide();
		} else {
			var banner = $("#banner, #nsbanner");
			$(banner).append("<div id='ns_setting'><a href='http://www.nationstates.net/page=blank?ns_settings=true' style='" + bannerStyle + " right: 78px;'>NS++ Settings</a></div>");
			if (pageUrl.indexOf('http://forum.nationstates.net/') == -1 ) {
				$(banner).append("<div id='puppet_setting' style='display:none;'><a href='javascript:void(0)' style='" + bannerStyle + " right: 188px;'>Puppets</a></div>");
			}
		}
	}

	if (pageUrl.indexOf("hidePanel=true") != -1) {
		$("#panel").hide();
		$("#content").css("margin-left", "0");
	}
	if (pageUrl.indexOf("hideFooter=true") != -1) {
		$("#foot").remove();
	}
	if (pageUrl.indexOf("hideFlag=true") != -1) {
		$(".bigflag").remove();
	}

	if (document.head.innerHTML.indexOf("ns.dark") != -1) {
		addStylesheet(urlPrefix + 'nationstates++_dark.css', true);
	}
	addStylesheet("//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css", false);

	if (pageUrl.indexOf("page=blank") != -1) {
		addStylesheet(staticUrlPrefix + 'newspaper_bootstrap.min.css', true);
		addJavascript(staticUrlPrefix + "bootstrap-dropdown.min.js", false);
		addStylesheet(staticUrlPrefix + "bootstrap-fileupload.min.css", false);
		addJavascript(staticUrlPrefix + "bootstrap-fileupload.min.js", false);
	}

	if (document.head.innerHTML.indexOf("//ajax.googleapis.com/ajax/libs/jquery") == -1) {
		addJavascript("//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js", false, function() {
			addJavascript("//ajax.googleapis.com/ajax/libs/jqueryui/1.10.2/jquery-ui.min.js", false);
		});
	}
	loadJavascript();
})();

function loadJavascript() {
	if (pageUrl.indexOf('http://www.nationstates.net/') > -1) {
		console.log('[NationStates++] Detected NationStates Page. Loading...');

		if (document.head.innerHTML.indexOf("antiquity") != -1) {
			addStylesheet(staticUrlPrefix + "prefix-ghbuttons_v2.css", false);
		}

		addJavascript(urlPrefix + 'highcharts-adapter.js', true);

		console.log('[NationStates++] Loading Completed Successfully.');
	} else if (pageUrl.indexOf('http://forum.nationstates.net/') > -1 ) {
		console.log('[NationStates++] Detected NationStates Forum Page. Loading...');
		addStylesheet("http://www.nationstates.net/ghbuttons_v2.css", false);
		var settings = getSettings();
		settings.update(function() { console.log("Update callback!"); });
		
		if (window.location.href.indexOf("posting.php?mode=post&f=15") != -1) {
			$("#postingbox").find(".inner:first").prepend("<div style='font-size: 16px; color: red; font-weight: bold; text-align: center;'>If you are reporting a bug in NationStates, be sure you disable NationStates++ and reproduce the bug to verify that it is not a bug with the NationStates++ extension first!</div>");
		}

		if (settings.isEnabled("highlight_op_posts")) {
			highlightAuthorPosts();
		}
		if (settings.isEnabled("floating_sidepanel")) {
			$("#nssidebar").css("margin-top", "-" + Math.min($(window).scrollTop(), 100) + "px");
			$("#nssidebar").find("iframe").css("height", "800px");
			$( window ).scroll(function() {
				$("#nssidebar").css("margin-top", "-" + Math.min($(window).scrollTop(), 100) + "px");
			});
			$("#nssidebar").css("position", "fixed");
		}
		if (settings.isEnabled("egosearch_ignore")) {
			showForumEgoposts();
		}
		if (settings.isEnabled("post_ids")) {
			if (window.location.href.indexOf("viewtopic.php") != -1) {
				$("div.post").each(function() {
					var marginLeft = 11 + (8 - $(this).attr("id").substring(1).length) * 4.4;
					$(this).find(".profile-icons").prepend("<li class='post-id-icon'><a href=" + window.location.href.split("#")[0] + "#" + $(this).attr("id") + " title='Post Number' target='_blank'><span class='post-id-text' style='margin-left:" + marginLeft + "px;'>" + $(this).attr("id").substring(1) + "</span></a></li>");
				});
			}
		}
		$(".icon-logout").hide();
		console.log('[NationStates++] Loading Completed Successfully.');
	}
}

function highlightAuthorPosts() {
	if (window.location.href.match("t=[0-9]+") != null && $(".postprofile:first").length > 0) {
		var highlightPosts = function(opNation) {
			$(".post").each(function() {
				var href = $(this).find(".postprofile:first").find("a:first").attr("href");
				var nation = href.split("/")[href.split("/").length - 1];
				if (nation == opNation) {
					$(this).addClass("op_posts");
				}
			});
		}
		if (window.location.href.match("start=[0-9]+") != null || window.location.href.match("p=[0-9]+") != null || window.location.href.indexOf("view=") != -1) {
			var regex = new RegExp("t=[0-9]{1,}", "g");
			var thread = window.location.href.match(regex)[0].substring(2);
			$.get("http://forum.nationstates.net/viewtopic.php?t=" + thread + "&start=0", function(data) {
				var href = $(data).find(".postprofile:first").find("a:first").attr("href");
				var nation = href.split("/")[href.split("/").length - 1];
				highlightPosts(nation);
			});
		} else {
			var href = $(".postprofile:first").find("a:first").attr("href");
			var nation = href.split("/")[href.split("/").length - 1];
			highlightPosts(nation);
		}
	}
}

function showForumEgoposts() {
	var pageUrl = window.location.href.indexOf("#") > -1 ? window.location.href.substring(0, window.location.href.indexOf("#")) : window.location.href;

	//Search page
	if (pageUrl.indexOf("/search.php?") > -1) {
		$(".lastpost:not(:first)").parent().append("<button class='ignore-egopost btn'><div class='ignore-egopost-body'>Ignore</div></button>");
		getUserData(true).update();
		var userData = getUserData(true);
		var ignoredTopics = userData.getValue("ignored_topics", {});
		var modified = false;
		$("ul.topiclist.topics").find("li.row").find("h3:first a").each(function() {
			var threadId = $(this).attr("href").match("t=[0-9]+")[0].substring(2);
			if (localStorage.getItem($(this).html()) == "true") {
				$(this).parents("li.row").hide();
				ignoredTopics[threadId] = true;
				localStorage.removeItem($(this).html());
				modified = true;
			}
			if (ignoredTopics[threadId]) {
				$(this).parents("li.row").hide();
			}
		});
		userData.setValue("ignored_topics", ignoredTopics);
		if (modified) {
			console.log("Updating user data");
			userData.pushUpdate();
		}
		$(".lastpost:first").parent().append("<button class='showall-egopost btn'><div class='showall-egopost-body'>Show All Posts</div></button>");
		$("button.ignore-egopost").on("click", function(event) {
			event.preventDefault();
			$(this).parents("li.row").animate({ height: 'toggle' }, 500);
			var threadId = $(this).parents("li.row").find("h3:first a").attr("href").match("t=[0-9]+")[0].substring(2);
			console.log("Hiding: " + threadId);
			var userData = getUserData(true);
			userData.setValue(userData.getValue("ignored_topics", {})[threadId] = true);
			userData.pushUpdate();
		});
		$("button.showall-egopost").on("click", function(event) {
			$("button.showall-egopost").attr("disabled", true);
			var userData = getUserData(true);
			var igoredTopics = userData.getValue("ignored_topics", {});
			$("ul.topiclist.topics").find("li.row:hidden").each(function() {
				$(this).animate({ height: 'toggle' }, 500);
				var threadId = $(this).find("h3:first a").attr("href").match("t=[0-9]+")[0].substring(2);
				console.log("restoring: " + threadId);
			});
			userData.setValue("ignored_topics", {});
			userData.pushUpdate(function() { 
				$("button.showall-egopost").attr("disabled", false);
			});
		});
	}
};

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
	} else if (event.data.method == "load_live_happenings") {
		window.location.href = "http://www.nationstates.net/page=news/?live_happenings=true";
	}
});

function addStylesheet(url, cacheBuster) {
	var style = document.createElement('link');
	style.setAttribute('rel', 'stylesheet');
	style.setAttribute('type', 'text/css');
	style.setAttribute('href', url + (cacheBuster ? (localStorage.getItem("cache_buster") != null ? ("?cache=" + localStorage.getItem("cache_buster")) : "") : ""));
	var split = url.split("/");
	style.id = split[split.length - 1];
	var styles = document.head.getElementsByTagName("style");
	for (var i = 0; i < styles.length; i++) {
		if (styles[i].id == style.id) {
			console.log("WARNING - DUPLICATE STYLE: " + style.id);
			return;
		}
	}
	document.head.appendChild(style);
}

function addJavascript(url, cacheBuster, onLoad) {
	var script = document.createElement('script');
	script.src = url + (cacheBuster ? (localStorage.getItem("cache_buster") != null ? ("?cache=" + localStorage.getItem("cache_buster")) : "") : "");
	var split = url.split("/");
	script.id = split[split.length - 1];
	if (onLoad) {
		script.addEventListener('load', onLoad);
	}
	var scripts = document.head.getElementsByTagName("script");
	for (var i = 0; i < scripts.length; i++) {
		if (scripts[i].id == script.id) {
			console.log("WARNING - DUPLICATE SCRIPT: " + script.id);
			return;
		}
	}
	console.log("Loading [" + script.id + "]");
	document.head.appendChild(script);
}
