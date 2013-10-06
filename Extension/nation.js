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
	
	var activeChart = null;
	function loadRegionEndorsements(region, showInfluence) {
		var snarkyComments = ["Bribing World Assembly Bureaucrats", "Reticulating Splines", "Expanding the Bureau of Bureaucracies",
								  "Greasing Palms", "Wandering World Assembly Halls Without A Map", "Redefining Success", "Running With Scissors",
								  "Being Corrupted By Power, Absolutely", "Watching Lightning Strike Twice", "Gazing Into The Abyss", "Loading",
								  "Wearing A Guy Fawkes Mask", "Making Faces At Delegates While Their Backs Are Turned", "Wondering Aloud", 
								  "Admiring TBR Banners", "Running, Not Walking", "Drawing Nazi Flags On Passed World Assembly Resolutions",
								  "Drafting Resolutions In Crayon", "Hiding 'The Rejected Realms' Name Placard", "Scrawling 'I <3 UDL' Into Bathroom Stalls",
								  "Switching Your Vote While No One Is Looking", "Spinning In A Wheeled Office Chair", "Saving The Rainforest", "Watching Big Brother",
								  "Building A Metropolis", "Taking Just One More Turn", "Watching Paint Dry"]
		$("#" + (showInfluence ? 'influence' : 'power')).html("<div id='snark' style='text-align:center; font-weight: bold; font-size: 16px;'><img style='margin-bottom: -2px; margin-right: 4px;' src='/images/loading1.gif'>" + snarkyComments[Math.floor(Math.random() * snarkyComments.length)] + "</div>");
		$.get("http://capitalistparadise.com/api/region/wa/?region=" + region, function(data) {
			var categoryTitles = [];
			var endorsements = [];
			var influence = [];
			var playerIndex = -1;
			for (var nation in data) {
				categoryTitles.push(nation );   
			}
			var sortNames = function(a, b) {
				return data[b].endorsements - data[a].endorsements;
			};
			categoryTitles.sort(sortNames);
    		for (var i = 0; i < categoryTitles.length; i++) {
				var nation = data[categoryTitles[i]];
				endorsements.push(nation.endorsements);
				influence.push(nation.influence);
				if (playerIndex == -1 && categoryTitles[i].toLowerCase().replaceAll(" ", "_") == getVisibleNation()) {
					playerIndex = i;
				}
				categoryTitles[i] = "<b>" + categoryTitles[i] + "</b>";
			}
			if (activeChart != null) {
				activeChart.destroy();
			}
			var series;
			if (showInfluence) {
				series = [{	name: 'Influence', data: influence, color: '#AA4643' },{
							name: 'Endorsements', data: endorsements, color: '#4572A7' }]
			} else {
				series = [{ name: 'Endorsements', data: endorsements, color: '#4572A7' }]
			}
			var container = $('<div>');
			chart = new Highcharts.Chart({
				chart: {
					type: 'bar',
					renderTo: container[0],
					width: $("#" + (showInfluence ? 'influence' : 'power')).width(),
					height: (categoryTitles.length * 26 * (showInfluence ? 2 : 1))
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
						overflow: 'justify',
						useHTML: true
					}
				},
				plotOptions: {
					bar: {
						dataLabels: {
							enabled: true
						}
					},
					series: {
						cursor: 'pointer',
						point: {
							events: {
								click: function() {
									var nation = this.category.substring(3, this.category.length - 4);
									window.location.href = "http://www.nationstates.net/nation=" + nation.toLowerCase().replaceAll(" ", "_") + "/detail=wa_stats/stats=" + (showInfluence ? 'influence' : 'power');
								}
							}
						}
					}
				},
				credits: {
					enabled: false
				},
				series: series
			});
			activeChart = chart;
			if (playerIndex > -1) {
				for (var i = 0; i < chart.series.length; i++) {
					chart.series[i].data[playerIndex].update({
						color: "#FF0000"
					});
				}
			}
			setTimeout(function() { $("#snark").remove(); container.appendTo($("#" + (showInfluence ? 'influence' : 'power')));}, 2000);
		});
	};
	
	function loadEndorsementStats(region) {
		var nation = getVisibleNation().replaceAll("_", " ").toTitleCase();
		$("#endorsements").html("<h4>World Assembly Member Nations without " + nation + "'s Endorsement</h4><div id='missingendo'>Loading...</div><hr></hr>" + 
								"<h4>World Assembly Member Nations who have not given " + nation + " an Endorsement</h4><div id='unreturnedendo'>Loading...</div>" + 
								"<h4>Endorsements given by " + nation + "</h4><div id='endorsements-given'>Loading...</div>");
								
		$.get("http://capitalistparadise.com/api/nation/missingendo/?name=" + getVisibleNation(), function(data) {
			var html = "";
			for (var i = 0; i < data.length; i++) {
				var nation = data[i];
				var formatted = nation.toLowerCase().replaceAll(" ", "_");
				if (i > 0) html += ", ";
				html += "<a href='nation=" + formatted + "' class='nlink'><img class='miniflag' alt='" + nation + 
				"' src='http://capitalistparadise.com/api/flag/nation/?nation=" + formatted + "'>" + nation + "</a>";
			}
			if (html.length == 0) {
				html = getVisibleNation().replaceAll("_", " ").toTitleCase() + " has endorsed all the nations in " + $(".rlink:first").attr("href").substring(7).replaceAll("_", " ").toTitleCase();
			}
			$("#missingendo").html(html);
		});
		$.get("http://capitalistparadise.com/api/nation/unreturnedendo/?name=" + getVisibleNation(), function(data) {
			var html = "";
			for (var i = 0; i < data.length; i++) {
				var nation = data[i];
				var formatted = nation.toLowerCase().replaceAll(" ", "_");
				if (i > 0) html += ", ";
				html += "<a href='nation=" + formatted + "' class='nlink'><img class='miniflag' alt='" + nation + 
				"' src='http://capitalistparadise.com/api/flag/nation/?nation=" + formatted + "'>" + nation + "</a>";
			}
			if (html.length == 0) {
				html = getVisibleNation().replaceAll("_", " ").toTitleCase() + " has been mutually endorsed by every nation.";
			}
			$("#unreturnedendo").html(html);
		});
		$.get("http://capitalistparadise.com/api/nation/endorsements/?name=" + getVisibleNation(), function(data) {
			var html = "";
			for (var i = 0; i < data.length; i++) {
				var nation = data[i];
				var formatted = nation.toLowerCase().replaceAll(" ", "_");
				if (i > 0) html += ", ";
				html += "<a href='nation=" + formatted + "' class='nlink'><img class='miniflag' alt='" + nation + 
				"' src='http://capitalistparadise.com/api/flag/nation/?nation=" + formatted + "'>" + nation + "</a>";
			}
			if (html.length == 0) {
				html = getVisibleNation().replaceAll("_", " ").toTitleCase() + " has not endorsed any World Assembly Member Nations!";
			}
			$("#endorsements-given").html(html);
		});
	}

	function openWorldAssemblyStats() {
		$("#wa_stats").html("<h3 style='text-align:center;'>" +
							"<a name='wa_stats' href='nation=" + getVisibleNation() + "/detail=wa_stats/stats=power'>Regional Power</a> - " +
							"<a name='wa_stats' href='nation=" + getVisibleNation() + "/detail=wa_stats/stats=influence'>Regional Influence</a> - " +
							"<a name='wa_stats' href='nation=" + getVisibleNation() + "/detail=wa_stats/stats=endorsements'>Endorsments</a>" +
							"</h3><div name='wa_stats' id='power'></div><div name='wa_stats' id='influence'></div><div name='wa_stats' id='endorsements'></div>");
		$("a[name='wa_stats']").on("click", function(event) {
			event.preventDefault();
			stats = getDetailStats($(this).attr("href"));
			loadWAStats(stats);
		});
		var stat = getDetailStats();
		if (stat == "") stat = "power";
		loadWAStats(stat);
	}

	function loadWAStats(stats) {
		$("div[name='wa_stats']").hide();
		$("#" + stats).html("");
		$("#" + stats).show();
		if (stats == "power") {
			loadRegionEndorsements($(".rlink:first").attr("href").substring(7), false);
		} else if (stats == "influence") {
			loadRegionEndorsements($(".rlink:first").attr("href").substring(7), true);
		} else if (stats == "endorsements") {
			loadEndorsementStats($(".rlink:first").attr("href").substring(7));
		}
	}

	function getDetailStats(url) {
		url = url || window.location.href;
		var split = url.split(/[/#/?]/);
		for (var i = 0; i < split.length; i++) {
			if (split[i].startsWith("stats=")) {
				return split[i].substring(6);
			}
		}
		return "";
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