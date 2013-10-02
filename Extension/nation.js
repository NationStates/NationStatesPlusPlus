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
		if (getPageDetail() == "wa_stats") {
			$(".smalltext:first").html("<a href='nation=" + getVisibleNation() + "'>Overview</a>" + $(".smalltext:first").html().substring(8) + $('<div/>').html(" &#8226; ").text() + "World Assembly");
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
			$("#nation_content").hide();
			for (var i = 0; i < items.length; i++) {
				$("#nation_content").append(items[i].clone());
			}
			for (var i = 0; i < items.length; i++) {
				items[i].remove();
			}
			openWorldAssemblyStats();
		} else {
			$(".smalltext:first").html($(".smalltext:first").html() + $('<div/>').html(" &#8226; ").text() + "<a id='wa_stats_link' href='nation=" + getVisibleNation() + "/detail=wa_stats'>World Assembly</a>");
		}
	}
	
	function loadRegionEndorsements(region) {
		$.get("http://capitalistparadise.com/api/region/wa/?region=" + region, function(data) {
			var categoryTitles = [];
			var dataPoints = [];
			for (var nation in data) {
				 categoryTitles.push(nation);   
				 dataPoints.push(data[nation].endorsements);
			}
			var sortNames = function(a, b) {
				return data[b].endorsements - data[a].endorsements;
			};
			var sortEndorsements = function(a, b) {
				return b - a;
			};
			categoryTitles.sort(sortNames);
			dataPoints.sort(sortEndorsements);
			chart = new Highcharts.Chart({
				chart: {
					type: 'bar',
					renderTo: 'all_endorsements',
					height: (dataPoints.length * 26)
				},
				title: {
					text: 'World Assembly Endorsements'
				},
				subtitle: {
					text: 'Region: ' + region.replaceAll("_", " ").toTitleCase()
				},
				xAxis: {
					categories: categoryTitles,
					title: {
						text: null
					}
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Endorsements',
						align: 'high'
					},
					labels: {
						overflow: 'justify'
					}
				},
				plotOptions: {
					bar: {
						dataLabels: {
							enabled: true
						}
					}
				},
				credits: {
					enabled: false
				},
				series: [{
					name: 'Endorsements',
					data: dataPoints
				}]
			});
		});
	};

	function openWorldAssemblyStats() {
		if ($(".wa_status").length == 0) {
			$("#wa_stats").html("<h3>World Assembly Stats</h3><p><b>Not A World Assembly Member!</b></p>");
			return;
		}
		$("#wa_stats").html("<h3>World Assembly Stats</h3><div id='all_endorsements'></div>");
		loadRegionEndorsements($(".rlink:first").attr("href").substring(7));
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