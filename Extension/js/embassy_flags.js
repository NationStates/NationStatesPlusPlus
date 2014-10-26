if (getVisiblePage() == "region") {
	//Dynamically hide or show embassy flags when the setting changes
	(new UserSettings()).child("embassy_flags").on(function(data) {
		console.log(data);
		if (data["embassy_flags"]) {
			sendWebsocketEvent("region_embassies", {});
		} else if ($("#embassy_flags").length != 0) {
			var wfe = $("fieldset[class='wfe']");
			$("<fieldset class='wfe'>" + wfe.html() + "</fieldset>").insertBefore($("div.colmask.rightmenu"));
			$("div.colmask.rightmenu").remove();
		}
	}, true, false);
}

$(window).on("websocket.region_embassies", function(event) {
	var embassies = event.json;
	if (embassies.length == 0)
		return;

	if ($("#embassy_flags").length == 0) {
		var wfe = $("fieldset[class='wfe']");
		wfe.css("min-height", "135px");
		wfe.wrap("<div class='colmask rightmenu'\><div id='wfe-main-content' class='colleft'\><div id='world_factbook_entry' class='col1'\>");
		$("#wfe-main-content").append("<div id='embassy_flags' class='col2' style='display:none'><fieldset class='wfe'><legend>Embassies</legend><div id='embassy-inner' style='height: " + (wfe.height() - 15) + "px; overflow:hidden; position:relative;'></div></fieldset></div>");
		$("#embassy_flags").attr("style", "height: " + $("#wfe-main-content").height() + "px;");
		$("fieldset[class='wfe']:last").attr("style", "height: " + wfe.height() + "px;");
		//Safari does not support calc css :(
		if (navigator.userAgent.indexOf('AppleWebKit') != -1) {
			updateSize = function() {
				$(".col1").css("width", "100%").css("width", "-=220px");
			}
			$(window).resize(updateSize);
			updateSize();
		}
	} else {
		$("#embassy-inner").html("");
	}

	var maxTop = -106;
	for (var i = 0; i < Math.min(25, embassies.length); i++) {
		var region = embassies[i];
		var name = region.name.toLowerCase().replaceAll(" ", "_");
		maxTop += 106;
		$("#embassy-inner").append("<div class='animate-flags' style='position:absolute; left:6px; top:" + maxTop + "px; padding: 2px 2px 2px 2px;'><a href='//www.nationstates.net/region=" + name + "' target='_blank'><img id='" + name + "' src='" + region.flag + "' class='rflag' style='width:140px; height:100px;' alt='' title='Regional Flag of " + region.name + "'></a></div>");
	}
	setTimeout(function() {
		$("#embassy_flags").show();
		if ($(".animate-flags").length * 106 >= $("fieldset[class='wfe']").height() + 100) {
			_embassyFlags = $("#embassy_flags").get();
			animateEmbassyFlags();
		}
	}, 1000);

	var _embassyFlags;
	function animateEmbassyFlags() {
		setTimeout(function() {
			if (!document.hidden && isScrolledIntoView(_embassyFlags)) {
				var maxTop = -10000000;
				$(".animate-flags").each(function() {
					if ($(this).position().top > maxTop)
						maxTop = $(this).position().top;
				});
				$(".animate-flags").each(function() {
					if ($(this).position().top < -106) {
						maxTop += 106;
						$(this).stop();
						$(this).clearQueue();
						$(this).css({ top: maxTop + 'px' });
					}
				});
				$(".animate-flags").animate({ "top": "-=1"}, 75);
			}
			animateEmbassyFlags();
		}, 75);
	}
});