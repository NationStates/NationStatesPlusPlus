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
	$("<li><a href='//www.nationstates.net/page=activity/view=world/filter=all'>ACTIVITY</a></li>").insertAfter(menu.find("a[href='page=dossier']").parent());
	checkPanelAlerts();
	//TODO: turn back on some day
	//addWAProposals();

	(new UserSettings()).child("show_dispatches").on(function(data) {
		if (!data["show_dispatches"]) {
			menu.find("a[href='page=dispatches']").hide();
		}
	}, true);

	if ($(".STANDOUT").length > 0) {
		var flagScroll = function() {
			$("#panel").css("margin-top", "-" + Math.min($(window).scrollTop(), 100) + "px");
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
		if ($(".menu").find("a[href='page=dilemmas']").html().match(/[0-9]+/) != null) {
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

	//Unread forum posts
	if (window.chrome) {
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

/* 	function updateProposals(start) {
		$.get("//www.nationstates.net/page=UN_proposal/council=0?start=" + start + "&nspp=1", function(data) {
			var totalProposals = 0;
			$(data).find("table.shiny").find("td[colspan='3']:contains('ID: ')").find("a").each(function() {
				var userData = getUserData();
				var proposals = userData.getValue("wa_proposals", {last_viewed: 0});
				if (proposals[$(this).text()] == null) {
					proposals[$(this).text()] = Date.now();
					userData.setValue("wa_proposals", proposals);
					userData.save();
				}
				totalProposals++;
			});
			if (totalProposals > 0) {
				var count = 0;
				var userData = getUserData();
				var proposals = userData.getValue("wa_proposals", {last_viewed: 0});
				var updated = {};
				updated.last_viewed = proposals.last_viewed;
				for (proposal in proposals) {
					if (proposal != "last_viewed") {
						if (proposals[proposal] > (Date.now - 7 * 24 * 60 * 60 * 1000)) {
							updated[proposal] = proposals[proposal];
							if (proposals[proposal] > proposals.last_viewed) {
								count++;
							}
						}
					}
				}
				userData.setValue("wa_proposals", updated);
				userData.pushUpdate();
				if (count > 0) {
					$("#wa_proposals").html("WA PROPOSALS (" + count + ")");
				} else {
					$("#wa_proposals").html("WA PROPOSALS");
				}
				
				updateProposals(start + 5);
			}
		});
	}

	function addWAProposals() {
		var delegateCache = localStorage.getItem("wa_delegate_cache");
		if (delegateCache != null && delegateCache.timestamp + 60 * 60 * 1000 < Date.now()) {
			delegateCache = null;
		}
		if (delegateCache != null) {
			delegateCache = JSON.parse(delegateCache);
		}
		if (getUserNation() == "shadow_afforess") {
			delegateCache = {wa_delegate:true};
		}
		if (delegateCache == null || delegateCache.wa_delegate) {
			(new UserSettings()).child("show_wa_proposals").once(function(data) {
				if (data["show_wa_proposals"]) {
					updateWAProposals(delegateCache);
				}
			}, true);
		}
	}

	function updateWAProposals(delegateCache) {
		if (delegateCache == null) {
			$.get("//www.nationstates.net/nation=" + getUserNation() + "&nspp=1", function(data) {
				if ($(data).find(".wa_status:contains('WA Delegate')").length > 0) {
					localStorage.setItem("wa_delegate_cache", JSON.stringify({wa_delegate: true, timestamp: Date.now()}));
				} else {
					localStorage.setItem("wa_delegate_cache", JSON.stringify({wa_delegate: false, timestamp: Date.now()}));
				}
			});
		} else {
			$("<li id='wa_props'><a id='wa_proposals' href='//www.nationstates.net/page=UN_proposal/council=0'>WA PROPOSALS</a></li").insertAfter($(".menu").find("a[href='page=un']").parent());
			updateProposals(0);
			$(window).on("page/update", function() {
				updateProposals(0);
				
			});
		}
	}
 */
	function updateSecurityCodes() {
		var chk = $("input[name='chk']");
		if (chk.length != 0) {
			$.get("/page=tgsettings?nspp=1", function(html) {
				if ($(html).find(".STANDOUT:first").attr("href").substring(7) == getUserNation()) {
					chk.val($(html).find("input[name='chk']").val());
				} else {
					console.log("Changed nations, can not update chk code");
				}
			});
		}
		var localid = $("input[name='localid']");
		if (localid.length != 0) {
			$.get("/page=settings?nspp=1", function(html) {
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
			if (window.chrome) {
				(new UserSettings()).child("show_unread_forum_posts").once(function(data) {
					if (!data["show_unread_forum_posts"]) {
						return;
					}
					$.get("//forum.nationstates.net/search.php?search_id=egosearch&nspp=1", function(data) {
						var count = 0;
						(new UserSettings()).child("ignored_topics").once(function(data) {
							var ignoredTopics = data["ignored_topics"];
							$(data.replace(/[ ]src=/gim," data-src=")).find("ul.topiclist.topics").find("li.row").find("h3:first a").each(function() {
								var threadId = $(this).attr("href").match("t=[0-9]+")[0].substring(2);
								if (!ignoredTopics[threadId]) {
									if ($(this).parents("li.row").find("dl:first").attr("style").contains("topic_unread_mine")) {
										count += 1;
									}
								}
							});
							(new UserSettings()).child("unread_forum_posts").set(count);
							if (count > 0) {
								$(".menu").find("a:contains('FORUM')").html("FORUM (" + count + ")");
							} else {
								$(".menu").find("a:contains('FORUM')").html("FORUM");
							}
						}, {});
					});
				}, true);
			}
		}
	}
	$(window).on("page/update", updatePanelAlerts);
})();