(function() {
	if (window.location.href.indexOf("template-overall=none") != -1) {
		return;
	}
	if (window.location.href.indexOf("/page=ajax2/a=reports/") != -1) {
		$(".rlink, .nlink").each(function() { $(this).attr("href", "//www.nationstates.net/" + $(this).attr("href")); });
		return;
	}
	if (getUserNation() == "") {
		return;
	}
	var menu = $(".menu");
	if (!isRiftTheme()) {
		$("<li><a href='//www.nationstates.net/page=activity/view=world/filter=all'>ACTIVITY</a></li>").insertAfter(menu.find("a[href='page=dossier']").parent());
	}
	checkPanelAlerts();

	if (!isRiftTheme()) {
		(new UserSettings()).child("show_dispatches").on(function(data) {
			if (!data["show_dispatches"]) {
				menu.find("a[href='page=dispatches']").hide();
			}
		}, true);
	}

	if ($(".STANDOUT").length > 0) {
		var scrollTimer;
		var flagScroll = function() {
			if (scrollTimer) return;
			scrollTimer = setTimeout(function() {
				$("#panel").hide();
				$("#panel").attr("offsetHeight");
				$("#panel").show();
				$("#panel").css("margin-top", "-" + Math.min($(window).scrollTop(), 100) + "px");
				scrollTimer = null;
			}, 200);
		};
		var handleFloatingSidepanel = function() {
			var data = arguments[0];
			var cache = (arguments.length > 1 ? arguments[1] : true);
			if (cache) {
				localStorage.setItem(getUserNation() + "_floating_sidepanel", data["floating_sidepanel"]);
			}
			if (data["floating_sidepanel"]) {
				var flag = $(".STANDOUT:first").find("img").attr("src");
				if (flag.match(/t[0-9]?.(jpg|png|gif)/).length > 0) {
					flag = flag.substring(0, flag.length - 6) + flag.substring(flag.length - 4);
				}
				var createdByAd = $("div[id^='createdby']");
				if ($("#panel_flag").length == 0) {
					$("<a id='panel_flag' href='//www.nationstates.net/nation=" + getUserNation() + "'><img src='" + flag + "' style='max-width: 192px; display: block; margin-left: auto; margin-right: auto; max-height: 400px;'></a>").insertBefore(createdByAd);
				}
				$("#panel_flag").show();
				createdByAd.hide();
				$(".STANDOUT:first").find("img").hide();
				$("#panel").css("position", "fixed");
				$("#nssidebar").css("margin-top", "-" + Math.min($(window).scrollTop(), 100) + "px");
				$( window ).scroll(flagScroll);
				flagScroll();
			} else {
				$("div[id^='createdby']").show();
				$(".STANDOUT:first").find("img").show();
				$("#panel_flag").hide();
				$(window).off("scroll", flagScroll);
				$("#nssidebar, #panel").css("margin-top", "0");
				$("#panel").css("position", "inherit");
			}
		};
		(new UserSettings()).child("floating_sidepanel").on(handleFloatingSidepanel, true);
		
		var defaultVal = localStorage.getItem(getUserNation() + "_floating_sidepanel");
		handleFloatingSidepanel({"floating_sidepanel": (defaultVal != null ? defaultVal : true)}, false);
	}

	function handleDismissAllIssues() {
		var hasIssuesToDismiss = false;
		if (isRiftTheme()) {
			hasIssuesToDismiss = $("a.bellink[href='/page=dilemmas'] .notificationnumber").length > 0;
		} else {
			hasIssuesToDismiss = $(".menu").find("a[href='page=dilemmas']").html().match(/[0-9]+/) != null;
		}
		if (hasIssuesToDismiss) {
			(new UserSettings()).child("dismiss_all").once(function(data) {
				if (data["dismiss_all"]) {
					$.post("//www.nationstates.net/page=dilemmas?nspp=1", "dismiss_all=1", function() { });
					updatePanelAlerts();
				}
			});
		}
	}
	handleDismissAllIssues();
	$(window).on("page/update", handleDismissAllIssues);

	if (getVisiblePage() == "blank" && document.head.innerHTML.indexOf("antiquity") != -1) {
		$("#main").append("<div id='content'></div>");
	}

	if (!isRiftTheme()) {
		(new UserSettings()).child("automatically_hide_flag").once(function(data) {
			if (data["automatically_hide_flag"]) {
				var minHeight = $("#panel").css("min-height");
				$("#panel").css("min-height", "0px");
				if ($("#panel").height() - 50 > $(window).height() || ($("#content").length == 0 && userSettings.isEnabled("small_screen_height", false))) {
					$("#panel_flag").hide();
					//Use this as a setting to sync with forumside
					(new UserSettings()).child("small_screen_height").set(true);
				} else {
					(new UserSettings()).child("small_screen_height").set(false);
				}
				$("#panel").css("min-height", minHeight);
			}
		}, false);
	}

	//Unread forum posts
	if (window.chrome && !isRiftTheme()) {
		(new UserSettings()).child("show_unread_forum_posts").on(function(data) {
			if (data["show_unread_forum_posts"]) {
				(new UserSettings()).child("unread_forum_posts").once(function(data) {
					if (data["unread_forum_posts"] > 0)
						$(".menu").find("a:contains('FORUM')").html("FORUM (" + data["unread_forum_posts"] + ")");
				}, 0);
			} else {
				$(".menu").find("a:contains('FORUM')").html("FORUM");
			}
		}, true);
	}

	function updateSecurityCodes() {
		var chk = $("input[name='chk']");
		if (chk.length != 0) {
			$.get("/page=tgsettings?nspp=1", function(html) {
				var nation = "";
				if ($(html).find(".bannernation a").attr("href")) {
					nation = $(html).find(".bannernation a").attr("href").trim().substring(8);
				} else {
					nation = $(html).find(".STANDOUT:first").attr("href").substring(7);
				}
				
				if (nation == getUserNation()) {
					chk.val($(html).find("input[name='chk']").val());
				} else {
					console.log("Changed nations, can not update chk code");
				}
			});
		}
		var localid = $("input[name='localid']");
		if (localid.length != 0) {
			$.get("/page=settings?nspp=1", function(html) {
				var nation = null;
				if ($(html).find(".bannernation a").attr("href")) {
					nation = $(html).find(".bannernation a").attr("href").trim().substring(8);
				} else if ($(html).find(".STANDOUT:first").attr("href")) {
					nation = $(html).find(".STANDOUT:first").attr("href").substring(7);
				}
				if (nation == getUserNation()) {
					localid.val($(html).find("input[name='localid']").val());
					console.log("Updating localid, nation unchanged");
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
	var _lastPanelUpdate = Date.now() - 25000;
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

	function updatePanelAlerts() {
		if (getUserNation() != "") {
			$.get("/page=panel/template-overall=none?nspp=1", function(html) {
				//Verify we haven't switched nations/logged out
				var nation = "";
				if ($(html).find(".bannernation a").attr("href")) {
					nation = $(html).find(".bannernation a").attr("href").trim().substring(8);
				} else if ($(html).find(".STANDOUT:first").attr("href")) {
					nation = $(html).find(".STANDOUT:first").attr("href").substring(7);
				}
				
				if (nation == getUserNation()) {
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