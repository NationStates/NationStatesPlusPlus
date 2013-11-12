(function() {
	if (window.location.href.indexOf("template-overall=none") != -1) {
		return;
	}
	var menu = $(".menu");
	$("<li><a href='http://www.nationstates.net/page=activity/view=world/filter=all'>ACTIVITY</a></li>").insertAfter(menu.find("a[href='page=dossier']").parent());
	window.postMessage({ method: "unread_forum_posts"}, "*");
	addWAProposals();
	checkPanelAlerts();

	var userSettings = getSettings();
	if ($(".STANDOUT").length > 0 && userSettings.isEnabled("floating_sidepanel")) {
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

	if (getVisiblePage() == "UN_proposal") {
		var userData = getUserData();
		var proposals = userData.getValue("wa_proposals", {last_viewed: 0});
		proposals.last_viewed = Date.now();
		userData.setValue("wa_proposals", proposals);
		userData.pushUpdate();
		$("#wa_proposals").html("WA PROPOSALS");
	}

	function updateProposals(start) {
		$.get("http://www.nationstates.net/page=UN_proposal/council=0?start=" + start, function(data) {
			var totalProposals = 0;
			$(data).find("table.shiny").find("td[colspan='3']:contains('ID: ')").find("a").each(function() {
				var userData = getUserData();
				var proposals = userData.getValue("wa_proposals", {last_viewed: 0});
				if (proposals[$(this).text()] == null) {
					proposals[$(this).text()] = Date.now();
				}
				userData.setValue("wa_proposals", proposals);
				userData.save();
				totalProposals++;
			});
			if (totalProposals > 0) {
				var count = 0;
				var userData = getUserData();
				var proposals = userData.getValue("wa_proposals", {last_viewed: 0});
				for (proposal in proposals) {
					if (proposal != "last_viewed") {
						if (proposals[proposal] > proposals.last_viewed) {
							count += 1;
						}
					}
				}
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
		var delegateCache = getUserData().getValue("wa_delegate");
		if (delegateCache != null && delegateCache.timestamp + 60 * 60 * 1000 < Date.now()) {
			delegateCache = null;
		}
		if (getUserNation() == "shadow_afforess") {
			delegateCache = {wa_delegate:true};
		}
		if (getSettings().isEnabled("show_wa_proposals") && (delegateCache == null || delegateCache.wa_delegate)) {
			if (delegateCache == null) {
				$.get("http://www.nationstates.net/nation=" + getUserNation(), function(data) {
					if ($(data).find(".wa_status:contains('WA Delegate')").length > 0) {
						getUserData().setValue("wa_delegate", {wa_delegate: true, timestamp: Date.now()});
					} else {
						getUserData().setValue("wa_delegate", {wa_delegate: false, timestamp: Date.now()});
					}
				});
			} else {
				$("<li id='wa_props'><a id='wa_proposals' href='http://www.nationstates.net/page=UN_proposal/council=0'>WA PROPOSALS</a></li").insertAfter($(".menu").find("a[href='page=un']").parent());
				$(window).on("page/update", function() {
					updateProposals(0);
					
				});
			}
		}
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
			//If there is no content element, we are trapped in an iframe and can not accurately judge activity or lack of it
			if ($("#content").length > 0) {
				if (!isPageActive()) {
					_pageInactiveCount += 1;
					updateDelay = 300000 * _pageInactiveCount; //5 min
				} else if (getLastActivity() + 60000 < Date.now()) {
					_pageInactiveCount += 1;
					updateDelay = 150000 * _pageInactiveCount; //2.5 min
				} else {
					_pageInactiveCount = 0;
				}
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