function doSetup() {
	if (typeof _commonsLoaded == 'undefined') {
		setTimeout(doSetup, 50);
	} else {
		addEmbassyFlags();
	}
}
doSetup();

function addEmbassyFlags() {
	var wfe = $("fieldset[class='wfe']");
	var embassies = $('p:contains("Embassies:")');
	if (typeof embassies.html() != 'undefined') {
		wfe.wrap("<div class='colmask rightmenu'\><div id='wfe-main-content' class='colleft'\><div id='world_factbook_entry' class='col1'\>");
		$("#wfe-main-content").append("<div id='embassy_flags' class='col2' style='display:none'><fieldset class='wfe'><legend>Embassies</legend><div id='embassy-inner' style='height: " + (wfe.height() - 15) + "px; overflow:hidden; position:relative;'></div></fieldset></div>");
		$("#embassy_flags").attr("style", "height: " + $("#wfe-main-content").height() + "px;");
		var embassyFlags = $("fieldset[class='wfe']:last");
		embassyFlags.attr("style", "height: " + wfe.height() + "px;");
		_embassyList = "";
		$(embassies).children().each(recurseEmbassies);
		var amazonURL = "http://ec2-54-244-210-176.us-west-2.compute.amazonaws.com";
		embassyArr = _embassyList.split(",");
		for (var i = 0; i < Math.min(5, embassyArr.length / 10); i++) {
			var list = "";
			var start = i * 10;
			var end = Math.min(start + 10, embassyArr.length);
			for (var j = start; j < end; j++) {
				if (j > start) 	list += ",";
				list += embassyArr[j]
			}
			$.getJSON(amazonURL + "/regionflag/?region=" + list, function(jsonData) {
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
							$("#embassy-inner").append("<div class='animate-flags' style='position:absolute; left:6px; top:" + maxTop + "px; padding: 2px 2px 2px 2px;'><a href='http://nationstates.net/region=" + regionName + "' target='_blank'><img src='" + flag + "' class='rflag' style='width:140px; height:100px;' alt='' title='Regional Flag of " + regionName.split("_").join(" ") + "'></a></div>");
						}
					}
				}
			});
		}
		setTimeout(function() {
			var count = 0;
			$(".animate-flags").each(function() {
				count += 1;
			});
			if (count > 0) {
				$("#embassy_flags").removeAttr("style");
				if (count * 106 >= wfe.height() + 100) {
					_embassyFlags = $("#embassy_flags").get();
					animateEmbassyFlags();
				}
			}
		}, 500);
	}
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

var _embassyList = "";
function recurseEmbassies() {
	if ($(this).html().indexOf("Embassies:") != -1) {
		return; //Ignore
	}
	if ($(this).html().indexOf('<a href="">') == -1) {
		if ($(this).children().length != 0) {
			$(this).children().each(recurseEmbassies);
		} else {
			if (_embassyList.length > 0) {
				_embassyList += ",";
			}
			_embassyList += $(this).html().replace(new RegExp(' ', 'g'), "_");
		}
	}
}