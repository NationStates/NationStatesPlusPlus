(function() {
	window.postMessage({ method: "unread_forum_posts"}, "*");
	checkPanelAlerts();
	addCustomAlerts();
	$("<li id='live_happenings_feed'><a href='http://www.nationstates.net/page=reports2/'>HAPPENINGS FEED</a></li>").insertAfter($($("#panel").find(".menu").children()[3]));
	$("<li id='ns_newspaper'><a id='ns_newspaper_link' style='display: inline;' href='http://www.nationstates.net/page=blank/?ns_newspaper=true'>GAMEPLAY NEWS</a></li>").insertAfter($("#live_happenings_feed"));
	if (!isSettingEnabled("show_live_happenings_feed")) {
		$("#live_happenings_feed").hide();
	}
	if (!isSettingEnabled("show_gameplay_news")) {
		$("#ns_newspaper").hide();
	}
	if (window.location.href.indexOf("ns_newspaper=true") != -1) {
		openNationStatesNews();
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
		content.html("<div id='news_header' style='text-align: center;'><h1>NationStates Aggregated News <i style='font-size: 14px;'>0&#162;/Daily</i></h1><i>NationStates Latest Gameplay News, a free service provided by NationStates++, the premier NationStates experience.</i><hr></div><div id='inner-content'><div id='left_column' style='position: absolute; width: 25%; padding-right: 0.5%; border-right: solid 1px black;'></div><div style='position: absolute; margin-left: 26%; width: 25%; padding-right: 0.5%; border-right: solid 1px black;' id='middle_column'></div><div id='right_column' style='position: absolute; margin-left: 52%; width: 25%;'></div></div><div id='bottom_content' style='text-align:center;'><i>Looking to have your article or content featured? Contact <a href='/nation=afforess' class='nlink'>Afforess</a> for submissions!</i></div>");
		loadingAnimation();
		window.document.title = "NationStates | Gameplay News"
		$(window).unbind("scroll");
		updateSize = function() {
			$("#inner-content").css("height", 0);
			$("#inner-content").children().each(function() {
				var height = $("#inner-content").height();
				$("#inner-content").css("height", Math.max(height, $(this).height() + 200) + "px");
			});
		}
		$.get("http://capitalistparadise.com/api/newspaper/gameplay/", function(json) {
			var getSelector = function(column) {
				switch (parseInt(column, 10)) {
					case 0:
						return $("#left_column");
					case 1:
						return $("#middle_column");
					case 2:
						return $("#right_column");
				}
			}
			$("#left_column, #middle_column, #right_column").html("");
			for (var order = 0; order < 5; order++) {
				for (var i = 0; i < json.length; i++) {
					var article = json[i];
					if (article.order == order) {
						var selector = getSelector(article.column);
						if (order > 0) selector.append("<hr style='margin-top: 40px;'>");
						selector.append("<div id='article_id_" + article.article_id + "'></div>");
					}
				}
			}
			for (var i = 0; i < json.length; i++) {
				var article = json[i];
				var selector = $("#article_id_" + article.article_id);
				var html = "<h2 style='margin-top:-5px;margin-bottom:-15px'>" + article.title + "</h2>";
				html += "<i><p>" + article.author + ", " + (new Date(parseInt(article.timestamp, 10))).customFormat("#D##th# #MMMM# #YYYY#") + "</p></i>";
				var text = article.article;
				text = text.replaceAll("[b]", "<b>").replaceAll("[/b]", "</b>");
				text = text.replaceAll("[i]", "<i>").replaceAll("[/i]", "</i>");
				text = text.replaceAll("[u]", "<u>").replaceAll("[/u]", "</u>");
				text = text.replaceAll("[blockquote]", "<blockquote class='news_quote'>").replaceAll("[/blockquote]", "</blockquote>");
				text = parseUrls(text);
				text = updateTextLinks("nation", text);
				text = updateTextLinks("region", text);
				html += text;
				selector.html(html);
			}
			window.onresize();
		});
		window.onresize = updateSize;
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

	function parseUrls(text) {
		var index = text.indexOf("[url=");
		while (index > -1) {
			var endIndex = text.indexOf("[/url]", index + 6);
			if (endIndex == -1) {
				break;
			}
			var innerText = text.substring(index + 5, endIndex);
			var url = innerText.substring(innerText.indexOf("=") + 1, innerText.indexOf("]"));
			
			text = text.substring(0, index) + "<a target='_blank' href='" + url + "'>" + innerText.substring(innerText.indexOf("]")) + "</a>" + text.substring(endIndex + 6);
			index = text.indexOf("[url=", index);
		}
		return text;
	}

	function addCustomAlerts() {
		if (localStorage.getItem("show_admin_area") == "true") {
		//	$(".menu").append("<li><a id='nationbot' href='http://capitalistparadise.com/api/nationbot/'>NATIONBOT ONLINE</a></li>");
		}
	}

	var _lastPanelUpdate = 0;
	function checkPanelAlerts() {
		setTimeout(function() {
			var updateDelay = 10000; //10 sec
			if (!isPageActive()) {
				updateDelay = 300000; //5 min
			} else if (getLastActivity() + 60000 < Date.now()) {
				updateDelay = 150000; //2.5 min
			}
			if (Date.now() > (_lastPanelUpdate + updateDelay)) {
				_lastPanelUpdate = Date.now();
				$(window).trigger("page/update");
			}
			checkPanelAlerts();
		}, 10000);
	}

	var _unreadForumPosts = 0;
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

	var updatePanelAlerts = function() {
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
		if ((lastRead == null || lastRead < 1378589818375)) {
			if ($("#ns_news_nag").length == 0)
				$("<span id='ns_news_nag'> (1)</span>").insertAfter($("#ns_newspaper_link"));
		} else {
			$("#ns_news_nag").remove();
		}
	}
	$(window).on("page/update", updatePanelAlerts);
})();