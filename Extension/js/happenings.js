(function() {
	var checkPageHappenings = function() {
		if (getVisiblePage() == "un" || getVisiblePage() == "nation" || getVisiblePage() == "region") {
			$.get(window.location.href, function(page) {

				var happeningSelector;
				if (getVisiblePage() == "un") {
					happeningSelector = $(page).find("h3:contains('Recent Events')").next();
				} else if (getVisiblePage() == "nation") {
					happeningSelector = $(page).find(".newsbox").find("ul");
				} else {
					happeningSelector = $(page).find("h3:contains('Regional Happenings')").next();
				}

				$(happeningSelector.children().get().reverse()).each(function() {
					var html = $(this).html();
					var split = $(this).text().split(":");
					var found = false;

					var happenings;
					if (getVisiblePage() == "un") {
						happenings = $("h3:contains('Recent Events')").next();
					} else if (getVisiblePage() == "nation") {
						happenings = $(".newsbox").find("ul")
					} else {
						happenings = $("h3:contains('Regional Happenings')").next();
					}

					$(happenings.children()).each(function() {
						if ($(this).text().contains(split[1])) {
							var text = $(this).html().substring($(this).html().indexOf(":") + 1);
							$(this).html(split[0] + ":" + text);
							found = true;
							return false;
						}
					});
					if (!found) {
						happenings.prepend("<li>" + html + "</li>");
					}
				});
			});
		}
	}
	$(window).on("page/update", checkPageHappenings);
	
	var happeningsIndex = 10;
	var endHappenings = false;
	function addInfiniteHappenings() {
		var happenings = (getVisiblePage() == "nation" ? $(".newsbox").find("ul") : $("h3:contains('Regional Happenings')").next());
		$("<div class='older' style='display: block;margin-left: 1%;  margin-right: 50%;'><a href='javascript:void(0)' id='more_happenings'><span id='load_more_happenings'>&#8593; Load More Happenings</span><span id='error_happenings'>Error Loading Happenings</span><span id='loading_happenings'>Loading...</span><span id='end_of_happenings'>End of Happenings</span></a></div>").insertAfter(happenings);
		$("#more_happenings").find("span").hide();
		$("#load_more_happenings").show();
		$("#more_happenings").on("click", function() {
			if (endHappenings) {
				return;
			}
			$("#more_happenings").find("span").hide();
			$("#loading_happenings").show();
			var url;
			if (getVisiblePage() == "nation") {
				url = "https://nationstatesplusplus.net/api/nation/happenings/?nation=" + getVisibleNation() + "&start=" + happeningsIndex;
			} else {
				url = "https://nationstatesplusplus.net/api/region/happenings/?region=" + getVisibleRegion() + "&start=" + happeningsIndex;
			}
			$.get(url, function(json, textStatus, xhr) {
				if (xhr.status != 204) {
					$("#more_happenings").find("span").hide();
					$("#load_more_happenings").show();
					parseHappenings(json, getVisiblePage() == "nation");
				} else {
					endHappenings = true;
					$("#more_happenings").find("span").hide();
					$("#end_of_happenings").show();
				}
			}).fail(function() {
				$("#more_happenings").find("span").hide();
				$("#error_happenings").show();
			});
		});
	}

	function parseHappenings(json, national) {
		var happenings = (national ? $(".newsbox").find("ul") : $("h3:contains('Regional Happenings')").next());
		for (var i = 0; i < json.length; i++) {
			var data = json[i];
			if (i == 0 && (data.happening.contains("Unknown nation:") || data.happening.contains("Unknown region:"))) {
				break;
			}
			happenings.append("<li style='display:none;' class='happenings_" + happeningsIndex + "'>" + timestampToTimeAgo(data.timestamp) + " ago: " + data.happening + "</li>");
		}
		$(".happenings_" + happeningsIndex).hide().animate({ height: 'toggle' }, 800);
		happeningsIndex += 20;
		if (20 > json.length) {
			endHappenings = true;
			$("#more_happenings").find("span").hide();
			$("#end_of_happenings").show();
		}
	}
	
	addInfiniteHappenings();
})();