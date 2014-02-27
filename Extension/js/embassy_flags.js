(function() {
	if (!getSettings().isEnabled("embassy_flags")) {
		return;
	}
	if ($('p:contains("Embassies:")').length > 0) {
		var wfe = $("fieldset[class='wfe']");
		wfe.css("min-height", "135px");
		wfe.wrap("<div class='colmask rightmenu'\><div id='wfe-main-content' class='colleft'\><div id='world_factbook_entry' class='col1'\>");
		$("#wfe-main-content").append("<div id='embassy_flags' class='col2' style='display:none'><fieldset class='wfe'><legend>Embassies</legend><div id='embassy-inner' style='height: " + (wfe.height() - 15) + "px; overflow:hidden; position:relative;'></div></fieldset></div>");
		$("#embassy_flags").attr("style", "height: " + $("#wfe-main-content").height() + "px;");
		$("fieldset[class='wfe']:last").attr("style", "height: " + wfe.height() + "px;");
		var regions = [];
		$('p:contains("Embassies:")').find(".rlink").each(function() {
			regions.push($(this).html().replace(new RegExp(' ', 'g'), "_"));
		});
		//Safari does not support calc css :(
		if ((navigator.userAgent.toLowerCase().indexOf('safari') !== -1 && navigator.userAgent.toLowerCase().indexOf('chrome') === -1) && typeof window.ontouchstart === 'undefined') {
			updateSize = function() {
				$(".col1").css("width", "100%").css("width", "-=220px");
			}
			window.onresize = updateSize;
			updateSize();
		}
		var step = 5;
		var maxFlags = 75;
		for (var i = 0; i < Math.min(maxFlags / step, regions.length / step); i++) {
			var list = "";
			var start = i * step;
			for (var j = start; j < Math.min(start + step, regions.length); j++) {
				if (j > start) 	list += ",";
				list += regions[j]
			}
			$.getJSON("https://nationstatesplusplus.net/api/regionflag/?region=" + list, function(jsonData) {
				var maxTop = -106;
				$(".animate-flags").each(function() {
					if ($(this).position().top > maxTop) {
						maxTop = $(this).position().top;
					}
				});
				for (var regionName in jsonData) {
					if (jsonData.hasOwnProperty(regionName)) {
						var flag = jsonData[regionName];
						if (flag != null && flag.length > 0) {
							maxTop += 106;
							$("#embassy-inner").append("<div class='animate-flags' style='position:absolute; left:6px; top:" + maxTop + "px; padding: 2px 2px 2px 2px;'><a href='//www.nationstates.net/region=" + regionName + "' target='_blank'><img id='" + regionName + "' src='" + flag + "' class='rflag' style='width:140px; height:100px;' alt='' title='Regional Flag of " + regionName.split("_").join(" ") + "'></a></div>");
							$("#" + regionName).error(function() {
								$(this).attr('src', "//www.nationstates.net/images/flags/Default.png");
								return true;
							});
						}
					}
				}
				updateFlags();
			});
		}
	}

	var animate = null;
	function updateFlags() {
		if (animate != null) {
			clearTimeout(animate);
		}
		animate = setTimeout(function() {
			$("#embassy_flags").removeAttr("style");
			if ($(".animate-flags").length * 106 >= $("fieldset[class='wfe']").height() + 100) {
				_embassyFlags = $("#embassy_flags").get();
				animateEmbassyFlags();
			}
		}, 1000);
	}

	var _embassyFlags;
	function animateEmbassyFlags() {
		setTimeout(function() {
			if (!document.hidden && isScrolledIntoView(_embassyFlags)) {
				var maxTop = -10000000;
				$(".animate-flags").each(function() {
					if ($(this).position().top > maxTop) {
						maxTop = $(this).position().top;
					}
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
})();