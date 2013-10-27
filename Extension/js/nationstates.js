(function() {
	var menu = $(".menu");
	$("<li><a href='http://www.nationstates.net/page=activity/view=world/filter=all'>ACTIVITY</a></li>").insertAfter(menu.find("a[href='page=dossier']").parent());
	window.postMessage({ method: "unread_forum_posts"}, "*");
	checkPanelAlerts();

	if ($(".STANDOUT").length > 0 && getSettings().isEnabled("floating_sidepanel")) {
		var flag = $(".STANDOUT:first").find("img").attr("src");
		if (flag.match(/t[0-9]?.(jpg|png|gif)/).length > 0) {
			flag = flag.substring(0, flag.length - 6) + flag.substring(flag.length - 4);
		}
		$("<a href='www.nationstates.net/nation=" + getUserNation() + "'><img src='" + flag + "' style='max-width: 192px; display: block; margin-left: auto; margin-right: auto; max-height: 400px;'></a>").insertBefore($("#createdby"));
		$("#createdby").remove();
		$(".STANDOUT:first").find("img").hide();
		$("#panel").css("position", "fixed");
		$("#nssidebar").css("margin-top", "-" + Math.min($(window).scrollTop(), 100) + "px");
		$( window ).scroll(function() {
			$("#panel").css("margin-top", "-" + Math.min($(window).scrollTop(), 100) + "px");
		});
	}

	if (getVisiblePage() == "blank" && document.head.innerHTML.indexOf("antiquity") != -1) {
		$("#main").append("<div id='content'></div>");
	}

	function updateSecurityCodes() {
		var chk = $("input[name='chk']");
		if (chk.length != 0) {
			$.get("/page=tgsettings", function(html) {
				if ($(html).find(".STANDOUT:first").attr("href").substring(7) == getUserNation()) {
					chk.val($(html).find("input[name='chk']").val());
				} else {
					console.log("Changed nations, can not update chk code");
				}
			});
		}
		var localid = $("input[name='localid']");
		if (localid.length != 0) {
			$.get("/page=settings", function(html) {
				if ($(html).find(".STANDOUT:first").attr("href").substring(7) == getUserNation()) {
					localid.val($(html).find("input[name='localid']").val());
				} else {
					console.log("Changed nations, can not update localid code");
				}
			});
		}
	}
	if (getUserNation() != "") {
		$(window).on("page/update", updateSecurityCodes);
	}

	var _pageInactiveCount = 0;
	var _lastPanelUpdate = 0;
	function checkPanelAlerts() {
		setTimeout(function() {
			var updateDelay = 30000; //30 sec
			if (!isPageActive()) {
				_pageInactiveCount += 1;
				updateDelay = 300000 * _pageInactiveCount; //5 min
			} else if (getLastActivity() + 60000 < Date.now()) {
				_pageInactiveCount += 1;
				updateDelay = 150000 * _pageInactiveCount; //2.5 min
			} else {
				_pageInactiveCount = 0;
			}
			if (Date.now() > (_lastPanelUpdate + updateDelay)) {
				_lastPanelUpdate = Date.now();
				$(window).trigger("page/update");
			}
			checkPanelAlerts();
		}, 500);
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
				//Verify we haven't switched nations/logged out
				if ($(html).find(".STANDOUT:first").attr("href").substring(7) == getUserNation()) {
					var page = $(html);
					var panel = $("#panel");
					if ($("#panel").length == 0) panel = $(document);
					panel.find("a[href='page=telegrams']").html(page.find("a[href='page=telegrams']").html());
					panel.find("a[href='page=dilemmas']").html(page.find("a[href='page=dilemmas']").html());
					panel.find("a[href='region=" + getUserRegion() + "']").html(page.find("a[href='region=" + getUserRegion() + "']").html());
					panel.find("a[href='page=news']").html(page.find("a[href='page=news']").html());
				}
			});
		}
	}
	$(window).on("page/update", updatePanelAlerts);
})();