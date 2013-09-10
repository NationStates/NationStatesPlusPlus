(function() {
	if (getVisiblePage() == "nation") {
		displaySoftPowerScore();
		fixFactbookLinks();
		showNationChallenge();
		showNationAlias();
		addInfiniteHappenings();
	}

	var happeningsIndex = 10;
	var endHappenings = false;
	function addInfiniteHappenings() {
		$("<div class='older' style='display: block;margin-left: 1%;  margin-right: 50%;'><a href='javascript:void(0)' id='more_happenings'><span id='load_more_happenings'>&#8593; Load More Happenings</span><span id='error_happenings'>Error Loading Happenings</span><span id='loading_happenings'>Loading...</span><span id='end_of_happenings'>End of Happenings</span></a></div>").insertAfter($(".newsbox").find("ul"));
		$("#more_happenings").find("span").hide();
		$("#load_more_happenings").show();
		$("#more_happenings").on("click", function() {
			if (endHappenings) {
				return;
			}
			$("#more_happenings").find("span").hide();
			$("#loading_happenings").show();
			$.get("http://capitalistparadise.com/api/happenings/?nation=" + getVisibleNation() + "&global=true&start=" + happeningsIndex + "&limit=20", function(json) {
				$("#more_happenings").find("span").hide();
				$("#load_more_happenings").show();
				parseHappenings(json);
			}).fail(function() {
				$("#more_happenings").find("span").hide();
				$("#error_happenings").show();
			});
		});
	}

	function parseHappenings(json) {
		var happenings = $(".newsbox").find("ul");
		for (var i = 0; i < json.length; i++) {
			var data = json[i];
			if (i == 0 && data.happening.contains("Unknown nation:")) {
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

	function showNationAlias() {
		if (getUserNation() != getVisibleNation()) {
			var alias = getNationAlias(getVisibleNation());
			if (alias != null) {
				$(".nationname").css("text-decoration", "line-through").css("display", "inline");
				$("<span style='margin-left: 15px; font-size: 24px; display: inline; font-family: monospace;'>(" + alias + ")</span>").insertAfter($(".nationname"));
			}
		}
	}

	function showNationChallenge() {
		if (getUserNation() != getVisibleNation()) {
			$(".smalltext:first").html($(".smalltext:first").html() + $('<div/>').html(" &#8226; ").text() + "<a href='/page=challenge?entity_name=" + getVisibleNation() + "'>Challenge</a>");
		} else {
			$(".smalltext:first").html($(".smalltext:first").html() + $('<div/>').html(" &#8226; ").text() + "<a href='/page=challenge'>Challenge</a>");
		}
	}

	function displaySoftPowerScore() {
		$.get("/page=compare/nations=" + getVisibleNation() + "?censusid=65", function(data) {
			var start = data.indexOf("backgroundColor:'rgba(255, 255, 255, 0.1)");
			var search = 'y: ';
			var index = data.indexOf(search, start) + search.length;
			
			//Comparing 2 nations, use 2nd compare
			var other = data.indexOf(search, index + 10);
			if (other > index && other < index + 100) {
				index = other + search.length;
			}
			
			var end = data.indexOf('}', index);
			var score = data.substring(index, end).trim();
			var html = $("#rinf").html();
			$("#rinf").html(html.substring(0, html.length - 4) + " (<a href='/page=compare/nations=" + getVisibleNation() + "?censusid=65'>" + score + "</a>)</p>");
		});
	}

	function fixFactbookLinks() {
		var factbooks = 0;
		$(".newsbox").find("ul").children("li").each(function() {
			var search = "published the Factbook";
			var index = $(this).html().indexOf(search);
			if (index != -1) {
				var factbookName = $(this).html().substring(index + search.length + 2, $(this).html().length - 2);
				$(this).html($(this).html().substring(0, index + search.length + 2) + "<span name='" + factbookName.toLowerCase().replaceAll(" ", "_") + "'>" + factbookName + "</span>\".");
				factbooks++;
			}
		});
		if (factbooks > 0) {
			$.get("/nation=" + getVisibleNation() + "/detail=factbook/", function(data) {
				$(data).find('ul[class=factbooklist]').find("a").each(function() {
					var link = $("span[name='" + $(this).html().toLowerCase().replaceAll(" ", "_") + "']");
					if (link.length > 0) {
						link.attr("href",  $(this).attr("href"));
						link.changeElementType("a");
					}
				});
			});
		}
	}
})();