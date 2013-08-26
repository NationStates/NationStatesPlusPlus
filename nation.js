(function() {
	if (getVisiblePage() == "nation") {
		displaySoftPowerScore();
		fixFactbookLinks();
		showNationChallenge();
		showNationAlias();
		addInfiniteHappenings();
	}
	
	var extraHappenings = null;
	var happeningsIndex = 0;
	var endHappenings = false;
	function addInfiniteHappenings() {
		$("<div class='rmbolder' style='display: block;margin-left: 1%;  margin-right: 50%%;'><a href='javascript:void(0)' id='more_happenings'>&#8593; Load More Happenings</a></div>").insertAfter($(".newsbox").find("ul"));
		$("#more_happenings").on("click", function() {
			if (endHappenings) {
				return;
			}
			if (extraHappenings == null) {
				$.get("http://capitalistparadise.com/api/happenings/?nation=" + getVisibleNation() + "&global=true&excludeNewest=true", function(json) {
					extraHappenings = json;
					addExtraHappenings();
				});
			} else {
				addExtraHappenings();
			}
		});
	}

	function addExtraHappenings() {
		var happenings = $(".newsbox").find("ul");
		for (var i = happeningsIndex; i < Math.min(happeningsIndex + 20, extraHappenings.length); i++) {
			var data = extraHappenings[i];
			if (i == 0 && data.happening.contains("Unknown nation:")) {
				break;
			}
			var threeDays = false;
			var time = "";
			var timeDiff = Date.now() - data.timestamp;
			if (timeDiff > 365 * 24 * 60 * 60 * 1000) {
				var years = Math.floor(timeDiff / (365 * 24 * 60 * 60 * 1000));
				if (years > 1) time += years + " years ";
				else time += "1 year ";
				timeDiff -= years * (365 * 24 * 60 * 60 * 1000);
			}
			if (timeDiff > 24 * 60 * 60 * 1000) {
				var days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
				threeDays = days > 3;
				if (days > 1) time += days + " days ";
				else time += "1 day ";
				timeDiff -= days * (24 * 60 * 60 * 1000);
			}
			if (!time.contains("year") && (!time.contains("days") || !threeDays) && timeDiff > 60 * 60 * 1000) {
				var hours = Math.floor(timeDiff / (60 * 60 * 1000));
				if (hours > 1) {
					time += hours + " hours ";
					timeDiff -= hours * (60 * 60 * 1000);
				}
			}
			if (!time.contains("year") && !time.contains("day") && !time.contains("hours") && timeDiff > 60 * 1000) {
				var minutes = Math.floor(timeDiff / (60 * 1000));
				if (minutes > 1) time += minutes + " minutes ";
				else time += "1 minutes ";
				timeDiff -= minutes * (60 * 1000);
			}
			if (!time.contains("year") && !time.contains("day") && !time.contains("hours") && !time.contains("minutes") && timeDiff > 1000) {
				time = "Seconds ";
			}
			time = time.substring(0, time.length - 1);
			happenings.append("<li style='display:none;' class='happenings_" + happeningsIndex + "'>" + time + " ago: " + data.happening + "</li>");
		}
		$(".happenings_" + happeningsIndex).hide().animate({ height: 'toggle' }, 800);
		happeningsIndex += 20;
		if (happeningsIndex >= extraHappenings.length) {
			endHappenings = true;
			$("#more_happenings").html("End of Happenings");
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
		var factbooks = new Array();
		$(".newsbox").find("ul").children().each(function() {
			var search = "published the Factbook";
			var index = $(this).html().indexOf(search);
			if (index != -1) {
				var factbookName = $(this).html().substring(index + search.length + 2, $(this).html().length - 2);
				var fb = new Object();
				fb['name'] = factbookName;
				fb['element'] = $(this).get();
				fb['start'] = index + search.length + 2;
				fb['end'] = $(this).html().length - 2;
				factbooks.push(fb);
			}
		});
		if (factbooks.length > 0) {
			$.get("/nation=" + getVisibleNation() + "/detail=factbook/", function(data) {
				$(data).find('ul[class=factbooklist]').find("a").each(function() {
					for (var i = 0; i < factbooks.length; i += 1) {
						var factbook = factbooks[i];
						if ($(this).html() == factbook['name']) {
							$(factbook['element']).html($(factbook['element']).html().substring(0, factbook['start']) + "<a href='" + $(this).attr("href") + "'>" + factbook['name'] + "</a>" + $(factbook['element']).html().substring(factbook['end']));
						}
					}
				});
			});
		}
	}
})();