(function() {
	window.postMessage({ method: "unread_forum_posts"}, "*");
	checkPanelAlerts();
	addCustomAlerts();
	$("<li id='live_happenings_feed'><a href='http://www.nationstates.net/page=reports2/'>HAPPENINGS FEED</a></li>").insertAfter($($("#panel").find(".menu").children()[3]));
	if (!isSettingEnabled("show_live_happenings_feed")) {
		$("#live_happenings_feed").hide();
	}
	
	function addCustomAlerts() {
		if (localStorage.getItem("show_admin_area") == "true") {
		//	$(".menu").append("<li><a id='nationbot' href='http://capitalistparadise.com/api/nationbot/'>NATIONBOT ONLINE</a></li>");
		}
	}

	function updateSecurityCodes() {
		var chk = $("input[name='chk']");
		if (chk.length != 0) {
			$.get("/page=tgsettings", function(html) {
				console.log("Updating chk to: " + $(html).find("input[name='chk']").val());
				chk.val($(html).find("input[name='chk']").val());
			});
		}
		var localid = $("input[name='localid']");
		if (localid.length != 0) {
			$.get("/page=settings", function(html) {
				console.log("Updating localid to: " + $(html).find("input[name='localid']").val());
				localid.val($(html).find("input[name='localid']").val());
			});
		}
	}
	$(window).on("page/update", updateSecurityCodes);

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