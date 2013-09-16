(function() {
	if (getVisiblePage() == "nation") {
		displaySoftPowerScore();
		fixFactbookLinks();
		showNationChallenge();
		showWorldAssemblyInfo();
		showNationAlias();
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

	function showWorldAssemblyInfo() {
		if ($(".wa_status").length > 0) {
			$(".smalltext:first").html($(".smalltext:first").html() + $('<div/>').html(" &#8226; ").text() + "<a id='wa_stats_link' href='/nation=" + getVisibleNation() + "/detail=wa_stats'>World Assembly</a>");
			if (getPageDetail() == "" || getPageDetail() == "wa_stats") {
				var foundSmalltext;
				var items = [];
				$("#content").children().each(function() { 
					if (foundSmalltext) {
						items.push($(this));
					}
					if ($(this).attr("class") == "smalltext") {
						foundSmalltext = true;
					}
				});
				$("<div id='nation_content'></div><div id='wa_stats'></div>").insertAfter($(".smalltext:first"));
				for (var i = 0; i < items.length; i++) {
					$("#nation_content").append(items[i].clone());
					items[i].remove();
				}
				$("#wa_stats_link").on("click", function(event) {
					if ($("#main").length == 0) {
						//don't cancel event
					} else {
						event.preventDefault();
						openWorldAssemblyStats();
					}
				});
			}
			if (getPageDetail() == "wa_stats") {
				openWorldAssemblyStats();
			}
		}
	}

	function openWorldAssemblyStats() {
		$("#nation_content").hide();
		$("#wa_stats").html("<h3>World Assembly Stats</h3><div id='all_nations'><h4>All World Assembly Nations</h4></div><div id='endorsements'><h4>Endorsements</h4></div>");
		$("#all_nations").append("<button id='calculate_wa' class='button'>Calculate</button><div id='all_wa'></div>");
		$("#endorsements").append($(".unbox").find("p").clone());
		$("#all_wa").hide();
		$("#calculate_wa").on("click", function() {
			$("#calculate_wa").html("Calculating - 0%");
			$("#calculate_wa").toggleDisabled();
			
			var region = $('.rlink:first').attr("href").substring(7);
			getNationStatesAPI().doRequest("http://www.nationstates.net/cgi-bin/api.cgi?region=" + region + "&q=nations").done(function(data) {
				var xml = (new window.DOMParser()).parseFromString(data, "text/xml");
				var nations = xml.getElementsByTagName("NATIONS")[0].textContent;
				var calculateWA = function(nations, index, callback) {
					console.log("Calculating WA, Index: " + index);
					var nationArr = nations.split(":");
					for (var i = index; i < Math.min(index + 40, nationArr.length); i++) {
						getNationStatesAPI().doRequest("http://www.nationstates.net/cgi-bin/api.cgi?nation=" + nationArr[i] + "&q=wa+flag+name").done(function(waData) {
							if (waData.indexOf("Non-member") == -1) {
								var xml = (new window.DOMParser()).parseFromString(waData, "text/xml");
								var flag = xml.getElementsByTagName("FLAG")[0].textContent;
								var nation = xml.getElementsByTagName("NATION")[0].getAttribute("id");
								var name = xml.getElementsByTagName("NAME")[0].textContent;
								console.log("nation: " + nation);
								console.log("name: " + name);
								console.log("flag: " + flag);
								$("#all_wa").append("<a href='nation=" + nation + "' class='nlink'><img src='" + flag + "' class='miniflag' alt='' title='" + name + "'><span>" + name + "<span></a>, ");
							}
						});
					}
					$("#calculate_wa").html("Calculating: " + (((index + 40) / nationArr.length) * 100).toFixed(3) + "%");
					if (index + 40 < nationArr.length) {
						setTimeout(callback, 60000, nations, index + 40, callback);
					} else {
						$("#all_wa").html($("#all_wa").html().substring(0, $("#all_wa").html().length - 2));
						$("#all_wa").show();
						$("#calculate_wa").remove();
					}
				}
				calculateWA(nations, 0, calculateWA);
			});
		})
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