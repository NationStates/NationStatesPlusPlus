var quote = '<button id="quote-btn-${id}" class="button QuoteButton" onclick="quotePost(this);">Quote</button>';
(function() {
	window.postMessage({ method: "unread_forum_posts"}, "*");
	checkPanelAlerts();
	addCustomAlerts();
	checkPageHappenings()
	$("<li id='live_happenings_feed'><a id='live_happenings_link' href='http://www.nationstates.net/page=news/?live_happenings=true'>HAPPENINGS FEED</a></li>").insertAfter($($("#panel").find(".menu").children()[3]));
	$("<li id='ns_newspaper'><a id='ns_newspaper_link' href='http://www.nationstates.net/page=news/?ns_newspaper=true'>GAMEPLAY NEWS</a></li>").insertAfter($("#live_happenings_feed"));
	if (!isSettingEnabled("show_live_happenings_feed")) {
		$("#live_happenings_feed").hide();
	}
	if (!isSettingEnabled("show_gameplay_news")) {
		$("#ns_newspaper").hide();
	}
	$("#live_happenings_link").on("click", function(event) {
		//iFrame?
		if ($("#main").length == 0) {
			//don't cancel event
		} else {
			event.preventDefault();
			openLiveHappeningsFeed();
		}
	});
	$("#ns_newspaper_link").on("click", function(event) {
		//iFrame?
		if ($("#main").length == 0) {
			//don't cancel event
		} else {
			event.preventDefault();
			openNationStatesNews();
		}
	});
	if (window.location.href.indexOf("live_happenings=true") != -1) {
		openLiveHappeningsFeed();
	} else if (window.location.href.indexOf("ns_newspaper=true") != -1) {
		openNationStatesNews();
	}
})();

function openNationStatesNews() {
	var content;
	if (document.head.innerHTML.indexOf("antiquity") != -1) {
		content = $("#main");
	} else {
		content = $("#content");
	}
	content.html("<h1>NationStates Gameplay News</h1><div id='inner-content'><iframe frameborder='0' src='https://docs.google.com/document/d/1ZBEiu96gYUM_Uecr4bxWXuCDsalUiVbCBKQ9VuJ9ffo/pub?embedded=true' style='width: 800px; height: 1000px; border: 2px solid black;'></iframe></div>");
	/*
	var doc = "document/d/1ZBEiu96gYUM_Uecr4bxWXuCDsalUiVbCBKQ9VuJ9ffo/";
	$.post("http://capitalistparadise.com/api/googledoc/", "doc=" + encodeURIComponent(doc + "pub?embedded=true"), function(html) {
		$("#inner-content").html(html);
		$("#inner-content").find("img").error(function() {
			if (!$(this).attr("src").startsWith("https://docs.google.com/")) {
				$(this).attr("src", "https://docs.google.com/" + doc + $(this).attr("src"));
			}
		});
	});
	*/
	$(window).unbind("scroll");
}

function openLiveHappeningsFeed() {
	var content;
	if (document.head.innerHTML.indexOf("antiquity") != -1) {
		content = $("#main");
	} else {
		content = $("#content");
	}
	content.html("<h1>Live Happenings Feed</h1><div id='inner-content'><ul id='happenings-feed'></ul></div>");
	$(window).unbind("scroll");
	updateLiveHappenings();
	updateTime();
	showLatestHappennings();
}

function updateTime() {
	if ($("h1").html().contains("Live Happenings Feed")) {
		$("h1").html("Live Happenings Feed (" + (new Date()).customFormat("#hh#:#mm#:#ss# #AMPM# - #DDDD# - #D##th# #MMMM# #YYYY#") + ")");
		setTimeout(updateTime, 500);
	}
}

function showLatestHappennings() {
	if (happeningsToShow.length > 0) {
		var amountToShow = Math.min(1, happeningsToShow.length / 30);
		var list = $("#happenings-feed");
		for (var i = 0; i < amountToShow; i++) {
			var id = happeningsToShow.pop();
			list.find("#" + id).animate({ height: 'toggle' }, 500);
		}
	}
	setTimeout(showLatestHappennings, 500);
}

var happeningsToShow = [];
function updateLiveHappenings() {
	$.get("http://capitalistparadise.com/api/nation/livefeed/", function(json) {
		var list = $("#happenings-feed");
		var empty = list.find("li").length == 0;
		var html = "";
		for (var i = 0; i < json.length; i++) {
			var happening = json[i];
			if (list.find("#" + happening.id).length == 0) {
				var time = (empty ? happening.timestamp : Date.now() - 5000);
				html += "<li " + (empty ? "" : "style='display:none;'") + " id='" + happening.id + "'><span time='" + time + "'>" +  timestampToTimeAgo(time) + "</span>" + " ago: " + happening.text + "</li>";
				if (!empty) {
					happeningsToShow.push(happening.id);
				}
			}
		}
		list.prepend(html);
		if (list.find("li").length == 0) {
			list.append("<li id='no-happenings'>No News Is Good News!</li>");
		} else if (list.find("li").length > 1) {
			$("#no-happenings").remove();
		}
	});
	var list = $("#happenings-feed");
	list.find("span:visible").each(function() {
		var time = $(this).attr("time");
		if (Date.now() - time > 1000 * 60 * 10) {
			$(this).parent().animate({ height: 'toggle' }, 500);
			var remove = function(obj) {
				$(obj).remove();
			}
			setTimeout(remove, 750, $(this).parent());
		} else {
			$(this).html(timestampToTimeAgo(time));
		}
	});
	setTimeout(updateLiveHappenings, 6001);
}

function addCustomAlerts() {
	if (localStorage.getItem("show_admin_area") == "true") {
	//	$(".menu").append("<li><a id='nationbot' href='http://capitalistparadise.com/api/nationbot/'>NATIONBOT ONLINE</a></li>");
	}
}

function checkPageHappenings() {
	if (getVisiblePage() == "un" || getVisiblePage() == "nation") {
		$.get(window.location.href, function(page) {
			var happeningSelector;
			if (getVisiblePage() == "un") {
				happeningSelector = $(page).find("h3:contains('Recent Events')").next();
			} else {
				happeningSelector = $(page).find(".newsbox").find("ul");
			}
			$(happeningSelector.children().get().reverse()).each(function() {
				var html = $(this).html();
				var split = $(this).text().split(":");
				var found = false;
				var happenings = (getVisiblePage() == "un" ? $("h3:contains('Recent Events')").next() : $(".newsbox").find("ul"));
				$(happenings.children()).each(function() {
					if ($(this).text().contains(split[1])) {
						$(this).html(html);
						found = true;
						return false;
					}
				});
				if (!found) {
					happenings.prepend("<li>" + html + "</li>");
				}
			});
		});
		setTimeout(checkPageHappenings, isPageActive() ? 6000 : 30000);
	}
}

var _lastPanelUpdate = 0;
function checkPanelAlerts() {
	//console.log("Checking Panel Alerts: " + Date.now());
	setTimeout(function() {
		var updateDelay = 10000; //10 sec
		if (!isPageActive()) {
			updateDelay = 300000; //5 min
		} else if (getLastActivity() + 60000 < Date.now()) {
			updateDelay = 150000; //2.5 min
		}
		if (Date.now() > (_lastPanelUpdate + updateDelay)) {
			_lastPanelUpdate = Date.now();
			updatePanelAlerts();
		}
		checkPanelAlerts();
	}, 10000);
}

window.addEventListener("message", function(event) {
	if (event.data.method == "unread_forum_posts_amt") {
		console.log("Unread forum posts: " + event.data.amt);
		if (event.data.amt != _unreadForumPosts) {
			_unreadForumPosts = event.data.amt;
			$("#panel").find("a").each(function() {
				if ($(this).html().indexOf("FORUM") != -1) {
					$(this).html("FORUM (" + _unreadForumPosts + ")");
					return false;
				}
			});
		}
	}
}, false);

var _panelForumLink = null;
var _unreadForumPosts = 0;
function updatePanelAlerts() {
	var unread = 0;
	if (getUserNation() != "") {
		window.postMessage({ method: "unread_forum_posts"}, "*");
		$.get('/page=panel/template-overall=none', function(html) {
			var searchString = '<a href="page=telegrams">';
			var indicatorStart = html.indexOf(searchString);
			var indicatorEnd = html.indexOf('</a>', indicatorStart);
			$('a[href$="page=telegrams"]').html(html.substring(indicatorStart + searchString.length, indicatorEnd));
		});
	}
}