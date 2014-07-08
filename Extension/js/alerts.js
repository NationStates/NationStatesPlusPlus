(function() {
	var alerts = localStorage.getItem("alerts");
	if (alerts == null) {
		alerts = { messages: [], next_update: -1 };
	} else {
		alerts = JSON.parse(alerts);
	}
	if (alerts.next_update < Date.now()) {
		$.get("https://nationstatesplusplus.net/nationstates/alerts.json", function(messages) {
			alerts.messages = messages;
			alerts.next_update = Date.now() + (1000 * 60 * 60); //cache for 1 hr
			localStorage.setItem("alerts", JSON.stringify(alerts));
			displayMessages(messages);
		});
	} else {
		displayMessages(alerts.messages);
	}

	function displayMessages(messages) {
		for (var i = 0; i < messages.length; i++) {
			var msg = messages[i];
			if (msg.start == -1 || msg.start > Date.now()) {
				if (msg.expires == -1 || msg.expires < Date.now()) {
					if (isBrowserMatch(msg.browser)) {
						if (isOlderNSPPVersion(msg.min_version)) {
							if (isNewerNSPPVersion(msg.max_version)) {
								msg.title.text = $("<div></div>").html(msg.title.text).text();
								addMessage(msg);
							}
						}
					}
				}
			}
		}
	}

	function addMessage(msg) {
		var banner = $("#banner, #nsbanner");
		var css = "position:absolute; top:0px; margin:6px 0px 0px 0px; z-index:98; font-weight: bold; font-size: 8pt; padding: 2px 8px 2px 8px; background: black; background-color: rgba(0,0,0,0.2); border-radius: 8px;";
		if (isDarkTheme()) {
			css += "background: #2A2A2A; border: 1px solid #383838;"
		}
		var right = 248;
		if ($("#puppet_setting:visible").length > 0) {
			right += $("#puppet_setting a").width() + 18;
		}
		var title = $(banner).append("<a id='alert_msg' href='javascript:void(0)' style='" + css + " right: " + right + "px;'>" + msg.title.text + "</a>");
		$("#alert_msg").css("color", msg.title.color);
		$("body").append("<div id='alert_msg_box'></div>");
		$("#alert_msg_box").html(parseBBCodes(msg.text));
		$("#alert_msg_box").css("max-width", ($(window).width() - 400) + "px");
		$("#alert_msg_box").append("<div style='margin-top: 15px; margin-bottom: 10px;'><button id='dismiss_alert_box' class='button' style='font-weight:bold; border-color: black;'>Dismiss Notice</button></div>")
		$("#alert_msg_box").hide();
		$("#alert_msg").on("click", function(event) {
			event.preventDefault();
			if ($("#alert_msg_box:visible").length == 0)
				$("#alert_msg_box").fadeIn("slow");
			else
				$("#alert_msg_box").fadeOut("slow");
		});
		$("#dismiss_alert_box").on("click", function(event) {
			event.preventDefault();
			$("#alert_msg_box").fadeOut("slow");
		});
	}

	function isNewerNSPPVersion(version) {
		var cur = $.nspp;
		var curSplit = cur.split("\.");
		var split = version.split("\.");
		var sum = 0;
		var curSum = 0;
		var multiplier = Math.pow(10, Math.max(split.length, curSplit.length));
		for (var i = 0; i < split.length; i++) {
			sum += parseInt(split[i]) * (multiplier / Math.pow(10, i + 1));
		}
		for (var i = 0; i < curSplit.length; i++) {
			curSum += parseInt(curSplit[i]) * (multiplier / Math.pow(10, i + 1));
		}
		return sum >= curSum;
	}

	function isOlderNSPPVersion(version) {
		if (version != $.nspp)
			return !isNewerNSPPVersion(version);
		return false;
	}

	function isBrowserMatch(browser) {
		if (browser == "all")
			return true;
		if (browser == "chrome")
			return typeof window.chrome != "undefined";
		if (browser == "firefox")
			return navigator.userAgent.toLowerCase().indexOf('firefox') != -1;
		if (browser == "safari")
			return navigator.userAgent.indexOf('AppleWebKit') != -1;
		return false;
	}
})();