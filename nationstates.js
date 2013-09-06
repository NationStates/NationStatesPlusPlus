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
	} else {
		monitorNationStatesUpdate();
		showNationStatesUpdate();
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
	if (window.location.href.indexOf("live_happenings=true") != -1) {
		openLiveHappeningsFeed();
	} else if (window.location.href.indexOf("ns_newspaper=true") != -1) {
		openNationStatesNews();
	}
	
	updatePanelAlerts();
})();

var updateStatus = false;
function monitorNationStatesUpdate() {
	$.get("http://capitalistparadise.com/api/nation/updateStatus/", function(json) {
		updateStatus = json["update"];
	});
	setTimeout(monitorNationStatesUpdate, 30000);
}

function showNationStatesUpdate() {
	var happenings = $("#live_happenings_link");
	if (updateStatus) {
		$("#live_happenings_link").attr("title", "High activity of national happenings in progress!");
		if (happenings.html().contains("!")) {
			$("#live_happenings_link").html("HAPPENINGS FEED");
		} else {
			$("#live_happenings_link").html("HAPPENINGS FEED!");
		}
	} else if (happenings.html().contains("!")) {
		$("#live_happenings_link").html("HAPPENINGS FEED");
		$("#live_happenings_link").attr("title", "Live happenings from across the NationStates realm");
	}
	setTimeout(showNationStatesUpdate, 600);
}
function openNationStatesNews() {
	localStorage.setItem("last_read_newspaper", Date.now());
	$("#ns_news_nag").remove();
	var content;
	if (document.head.innerHTML.indexOf("antiquity") != -1) {
		content = $("#main");
		$("#foot").remove();
	} else {
		content = $("#content");
	}
	content.html("<div id='news_header' style='text-align: center;'><h1>NationStates Aggregated News <i style='font-size: 14px;'>0&#162;/Daily</i></h1><i>NationStates Latest Gameplay News, a free service provided by NationStates++, the premier NationStates experience.</i><hr></div><div id='inner-content'><div id='left_column' style='position: absolute; width: 25%; padding-right: 0.5%; border-right: solid 1px black;'></div><div style='position: absolute; margin-left: 26%; width: 25%; padding-right: 0.5%; border-right: solid 1px black;' id='middle_column'></div><div id='right_column' style='position: absolute; margin-left: 52%; width: 25%;'></div></div>");
	//addArticle("document/d/1A8ewl1BcW6GXis-meRf3Vz74Z3KmO6MjUkk0T-NofOQ/", "left_column");
	addArticle("document/d/1zxH5SkR6GwMx4TOi8vsUnlVuInNxJeyOQWYgs9BR_ww/", "left_column");
	//addArticle("document/d/1sfI4_SwmFJjdThGdgNJEgTiC6y5Jd5nBBZ4m6p8KBCo/", "middle_column");
	addArticle("document/d/1Y3hw44lYIKd9SgoeNeefg2o6Is2P2AChU7BS2mKkHBY/", "middle_column");
	//addArticle("document/d/1e-HY4P-IPFKnB7FsdeFArKHasEbRt2rQ9IloJ-93_10/", "right_column");
	addArticle("document/d/1GCKIl7GePcYpJ4ipJwkLrLdCYYWOr2Fc2bxQSbIqKQo/", "right_column");
	loadingAnimation();
	window.document.title = "NationStates | Gameplay News"
	$(window).unbind("scroll");
}

function addArticle(document, columnId) {
	$("#" + columnId).html("<div class='loading_animation' style='background-image:url(http://capitalistparadise.com/nationstates/static/loading.gif); margin-left: 33%; height:128px; width:128px; -webkit-transform:scale(0.25); transform:scale(0.25);'></div>");
	$.post("http://capitalistparadise.com/api/googledoc/", "doc=" + encodeURIComponent(document + "pub?embedded=true"), function(html) {
		var text = $('<div />').html(html).text();
		var start = text.indexOf("<h2");
		text = text.substring(start);
		text = updateTextLinks("nation", text);
		text = updateTextLinks("region", text);
		$("#" + columnId).html(text);
		
		$("#" + columnId).find("img").error(function() {
			if (!$(this).attr("src").startsWith("https://docs.google.com/")) {
				$(this).attr("src", "https://docs.google.com/" + document + $(this).attr("src"));
			}
		});
		
		var height = $("#inner-content").height();
		$("#inner-content").css("height", Math.max(height, $("#" + columnId).height() + 400) + "px");
	});
}

function loadingAnimation() {
	if ($(".loading_animation").length > 0) {
		$(".loading_animation").each(function() {
			var frame = $(this).attr("frame");
			frame = (frame != null ? parseInt(frame) : 0);
			frame += 1;
			if (frame > 18) frame = 0;
			$(this).attr("frame", frame);
			$(this).css("background-position", frame * -128 + "px 0px");
		});
		setTimeout(loadingAnimation, 50);
	}
}

function updateTextLinks(tag, text) {
	var index = text.indexOf("[" + tag + "]");
	while (index > -1) {
		var endIndex = text.indexOf("[/" + tag + "]", index + tag.length + 2);
		if (endIndex == -1) {
			break;
		}
		var innerText = text.substring(index + tag.length + 2, endIndex);
		text = text.substring(0, index) + "<a target='_blank' href='/" + tag + "=" + innerText.toLowerCase().replaceAll(" ", "_") + "'>" + innerText + "</a>" + text.substring(endIndex + tag.length + 3);
		index = text.indexOf("[" + tag + "]", index);
	}
	return text;
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
	happeningsToShow = [];
	window.document.title = "NationStates | Live Happenings"
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

var happeningsToShow = [];
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
	var lastRead = localStorage.getItem("last_read_newspaper");
	var lastNewspaperUpdate = new Date(2013, 8, 5, 23, 13, 0, 0);
	if (lastRead == null || lastRead < lastNewspaperUpdate.getTime() && $("#ns_news_nag").length == 0) {
		$("#ns_newspaper_link").html($("#ns_newspaper_link").html() + "<span id='ns_news_nag'> (1)</span>");
	} else {
		$("#ns_news_nag").remove();
	}
}