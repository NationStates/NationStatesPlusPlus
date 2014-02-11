(function() {
	if (getVisiblePage() == "nation") {
		if (window.location.href.contains("nation=afforess")) {
			displayAfforess();
		} else if (window.location.href.contains("nation=francos_spain")) {
			window.document.title = "The Pacific Folk Hero of Francos Spain";
			$.get("https://nationstatesplusplus.net/nationstates/static/francos_spain.html", function(data) {
				$("#content").html(data);
			});
		} else {
			displaySoftPowerScore();
			showNationChallenge();
			showWorldAssemblyInfo();
			showNationAlias();
			loadNSPPSupporterIcon();
			loadPlayerDispatches();
			showNSWikiLink();
			window.onpopstate = function(event) {
				if (event.state) {
					loadWAStats(event.state.page);
					window.history.replaceState(event.state, "", "/nation=" + getVisibleNation() + "/detail=wa_stats/stat=" + event.state.page);
				}
			};
		}
	}
	
	function showNSWikiLink() {
		$(".nationnavbar").append($('<div/>').html(" &#8226; ").text() + "<a href='http://nswiki.org/Nation/" + getVisibleNation().replaceAll("_", " ").toTitleCase() + "'>NSWiki</a>");
	}
	
	function loadPlayerDispatches() {
		if (getPageDetail() == "factbook") {
			$(".dispatchlist").html("<div style='text-align:center; font-weight: bold; font-size: 16px;'><img style='margin-bottom: -2px; margin-right: 4px;' src='/images/loading1.gif'></div>");
			$.get(nsProtocol() + "nationstates.net/page=dispatches/nation=" + getVisibleNation(), function(data) {
				$(".dispatchlist").html($(data).find(".dispatchlist").html());
			});
		}
		$("a:contains('Dispatches')").remove();
		$(".nationnavbar").html($(".nationnavbar").html().replace(" •  • ", " • "));
	}
	
	function displayAfforess() {
		window.document.title = "The Free Republic of Afforess";
		var contents = "https://nationstatesplusplus.net/nationstates/afforess.html";
		if (getPageDetail() == "people") {
			contents = "https://nationstatesplusplus.net/nationstates/people.html"
		}
		if (getPageDetail() == "government") {
			contents = "https://nationstatesplusplus.net/nationstates/government.html"
		}
		if (getPageDetail() == "trend") {
			contents = "https://nationstatesplusplus.net/nationstates/trend.html"
		}
		$.get(contents, function(data) {
			$("#content").html($(data).html());
		});
	}

	function loadNSPPSupporterIcon() {
		if ($(".trophy:first").length > 0) {
			$(".trophy:first").parent().prepend("<img id='nspp_trophy' src='https://nationstatesplusplus.net/nationstates/static/nspp.png?v' class='trophy' title='A Proud NationStates++ User!'>");
			$("#nspp_trophy").hide();
		}
		$.get("https://nationstatesplusplus.net/api/nation/latest_update/?name=" + getVisibleNation(), function(data, textStatus, xhr) {
			if (xhr.status != 204 && data.timestamp > (Date.now() - 30 * 24 * 60 * 60 * 1000)) {
				if (data.timestamp > (Date.now() - 15 * 60 * 1000)) {
					$("#nspp_trophy").attr("src", "https://nationstatesplusplus.net/nationstates/static/nspp_online.png");
					$("#nspp_trophy").attr("title", $("#nspp_trophy").attr("title") + "\nCurrently Online!");
				} else {
					var opacity = 1 - ((Date.now() - data.timestamp + 3 * 24 * 60 * 60 * 1000) / (30 * 24 * 60 * 60 * 1000));
					console.log(Date.now() - data.timestamp);
					console.log(Date.now() - data.timestamp + 3 * 24 * 60 * 60 * 1000);
					console.log(opacity);
					$("#nspp_trophy").attr("title", $("#nspp_trophy").attr("title") + "\nLast seen " + timestampToTimeAgo(data.timestamp).toLowerCase() + " ago.");
					$("#nspp_trophy").css("opacity", Math.max(0, Math.min(1, opacity)));
				}
				$("#nspp_trophy").show();
			}
		});
		$.get("https://nationstatesplusplus.net/nationstates/feature_authors.json", function(data) {
			var nation = getVisibleNation();
			for (var i = 0; i < data.authors.length; i += 1) {
				if (data.authors[i] == nation) {
					if ($("#nspp_trophy").length > 0) {
						$("<img src='https://nationstatesplusplus.net/nationstates/static/nspp_idea.png' class='trophy' title='NationStates++ Feature Author!'>").insertAfter("#nspp_trophy");
					}
				}
			}
		});
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
			$(".nationnavbar").append($('<div/>').html(" &#8226; ").text() + "<a href='/page=challenge?entity_name=" + getVisibleNation() + "'>Challenge</a>");
		} else {
			$(".nationnavbar").append($('<div/>').html(" &#8226; ").text() + "<a href='/page=challenge'>Challenge</a>");
		}
	}

	function showWorldAssemblyInfo() {
		$(".nationnavbar").append($('<div/>').html(" &#8226; ").text() + "<a id='wa_stats_link' href='nation=" + getVisibleNation() + "/detail=wa_stats'>World Assembly</a>");
		if (getPageDetail() == "wa_stats") {
			$(".nationnavbar a").removeClass("quietlink");
			$("#wa_stats_link").addClass("quietlink");
			
			$("form").filter(function() { return $(this).attr("action") == null || $(this).attr("action").startsWith("page"); }).remove();
			
			var start = $(".nationnavbar").next();
			var count = 0;
			while(true) {
				count += 1;
				if (count > 15 || start.is("p")) break;
				start = start.next();
			}
			var insertAfter = start.prev();
			start.next().next().next().next().remove();
			start.next().next().next().remove();
			start.next().next().remove();
			start.next().remove();
			start.remove();
			$(".newsbox, .unbox").remove();
			
			var after = $(".wa_status");
			$("<div id='wa_stats'></div>").insertAfter(insertAfter);
			openWorldAssemblyStats();
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
								  "Building A Metropolis", "Taking Just One More Turn", "Watching Paint Dry", "Stealing the head from Milograd's statue"]
		$("#" + (showInfluence ? 'influence' : 'power')).html("<div id='snark' style='text-align:center; font-weight: bold; font-size: 16px;'><img style='margin-bottom: -2px; margin-right: 4px;' src='/images/loading1.gif'>" + snarkyComments[Math.floor(Math.random() * snarkyComments.length)] + "</div>");
		$("<div id='highcharts_graph' graph='national_power' region='" + region + "' title='" + region.replaceAll("_", " ").toTitleCase() + "' visible_nation='" + getVisibleNation() + "' show_influence='" + showInfluence + "'></div>").insertAfter($("#snark"));
	};
	
	function loadEndorsementStats(region) {
		var nation = getVisibleNation().replaceAll("_", " ").toTitleCase();
		$("#endorsements").html("<h4>World Assembly Member Nations without " + nation + "'s Endorsement</h4><div id='missingendo'>Loading...</div><hr></hr>" + 
								"<h4>World Assembly Member Nations who have not given " + nation + " an Endorsement</h4><div id='unreturnedendo'>Loading...</div><hr></hr>" + 
								"<h4>Endorsements given by " + nation + "</h4><div id='endorsements-given'>Loading...</div>");
								
		$.get("https://nationstatesplusplus.net/api/nation/missingendo/?fullData=true&name=" + getVisibleNation(), function(data) {
			var html = "";
			for (var i = 0; i < data.length; i++) {
				var nation = data[i];
				if (i > 0) html += ", ";
				html += "<a href='nation=" + nation.name + "' class='nlink' title='" + nation.fullName + "'><img class='miniflag' alt='" + nation.fullName + 
				"' src='" + nation.flag + "'>" + nation.title + "</a>";
			}
			if (html.length == 0) {
				html = getVisibleNation().replaceAll("_", " ").toTitleCase() + " has endorsed all the nations in " + $(".rlink:first").attr("href").substring(7).replaceAll("_", " ").toTitleCase();
			}
			$("#missingendo").html(html);
		});
		$.get("https://nationstatesplusplus.net/api/nation/unreturnedendo/?fullData=true&name=" + getVisibleNation(), function(data) {
			var html = "";
			for (var i = 0; i < data.length; i++) {
				var nation = data[i];
				if (i > 0) html += ", ";
				html += "<a href='nation=" + nation.name + "' class='nlink' title='" + nation.fullName + "'><img class='miniflag' alt='" + nation.fullName + 
				"' src='" + nation.flag + "'>" + nation.title + "</a>";
			}
			if (html.length == 0) {
				html = getVisibleNation().replaceAll("_", " ").toTitleCase() + " has been mutually endorsed by every nation.";
			}
			$("#unreturnedendo").html(html);
		});
		$.get("https://nationstatesplusplus.net/api/nation/endorsements/?fullData=true&name=" + getVisibleNation(), function(data) {
			var html = "";
			for (var i = 0; i < data.length; i++) {
				var nation = data[i];
				if (i > 0) html += ", ";
				html += "<a href='nation=" + nation.name + "' class='nlink' title='" + nation.fullName + "'><img class='miniflag' alt='" + nation.fullName + 
				"' src='" + nation.flag + "'>" + nation.title + "</a>";
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
							"<a name='wa_stats' href='nation=" + getVisibleNation() + "/detail=wa_stats/stats=endorsements'>Endorsements</a>" +
							"</h3><div name='wa_stats' id='power'></div><div name='wa_stats' id='influence'></div><div name='wa_stats' id='endorsements'></div>");
		$("a[name='wa_stats']").on("click", function(event) {
			if (event.ctrlKey && event.button == 0 || event.button != 0) {
				return;
			}
			event.preventDefault();
			stats = getDetailStats($(this).attr("href"));
			loadWAStats(stats);
			if (window.history) {
				window.history.pushState({page: stats}, "", "/nation=" + getVisibleNation() + "/detail=wa_stats/stats=" + stats);
			}
		});
		var stat = getDetailStats();
		if (stat == "") stat = "power";
		console.log(stat);
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
			
			var nextScore = 0;
			var endos = 1;
			if ($(".wa_status").length > 0) {
				endos = endos + $(".unbox").find("a.nlink").length;
			}
			nextScore = Math.floor(Math.sqrt((score * score)  + endos) * 100) / 100;
			
			//Add * for GCR's
			var gcrs = {the_south_pacific: true, the_north_pacific: true, the_pacific: true, the_west_pacific: true, the_east_pacific: true, lazarus: true, balder: true, osiris: true, the_rejected_realms: true};
			
			html = html.substring(0, html.length - 4)
			html = html + " (<a href='/page=compare/nations=" + getVisibleNation() + "?censusid=65'>" + score;
			//Gaining influence
			if (nextScore > score) {
				var region = $(".rlink:first").attr("href").substring(7);
				html = html + "<span title='The amount of SPDR influence your nation will receive in the next update.'> + " + (nextScore - score).toFixed(2) + "</span>";
				if (gcrs[region]) {
					html = html + '<span title="Influence growth in Game Created Region\'s is not well-predictable, and this estimate may be off">*</span>';
				}
			}
			html = html + "</a>)</p>"
			$("#rinf").html(html);
		});
	}
})();

function getSPDR(nation, callback) {
	$.get("/page=compare/nations=" + nation + "?censusid=65", function(data) {
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
		callback(score);
	});
}