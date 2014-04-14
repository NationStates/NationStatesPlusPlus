(function() {
	if (getVisiblePage() == "ga" || getVisiblePage() == "sc") {
		if ($("h3:contains('Resolution At Vote')").length > 0) {
			var resolution = $("h2").text();
			if (resolution) {
				showIndividualVotes();
			}
		}
	}
	
	if (localStorage.getItem("wa_alert_1") == null && Date.now() < 1397577465000) {
		if (getVisiblePage() == "ga") {
			if ($('h2:contains(\'Repeal "Rights and Duties of WA States"\')').length > 0 && $("#content span:contains('The Dourian Embassy')".length > 0)) {
				$("body").prepend("<div id='wa_alert' style='width: 600px; padding: 5px; position: absolute; top: 250px; left: 0px; z-index: 10; background: white; border: 5px solid red; '><div id='wa_notice'></div><div style='display:none' id='wa-report-content'></div><div><button class='btn' id='read_wa_report'>Read Report</button><button class='btn' style='float:right;' id='close_wa_report'>Ignore Report</button></div></div>");
				$("#wa_alert").css("left", ($("body").width() / 2  - 350) + "px");
				$("#wa_notice").html("<h3 style='text-align:center;'>NationStates++ Alert</h3><h2 style='text-align:center;'>World Assembly Manipulation!</h2><span id='wa_spoiler'><p>The Dourian Embassy has submitted this resolution under false pretences and is manipulating the world assembly body to...</p></span>");
				$("#wa-report-content").html("<p>The Dourian Embassy has submitted this resolution under false pretences and is manipulating the world assembly body to prevent the resolution from passing.</p><h3>Resolution History</h3><p>Aurulia, under the puppet 'The World Assembly Embassy of Auralian Mission', submitted the above repeal legislation a month previously. The resolution to repeal GA #2 was passed 7300 v 3000, but was discarded at the last minute by game moderators. Moderators claimed that the submitting nation name 'The World Assembly Embassy of Auralian Mission' had implied that the resolution was officially supported by the World Assembly. Nothing about the resolution text itself or the repeal was illegal, only the name of the submitting nation. So The Dourian Embassy asked Auralia if he could re-submit the <i>exact same resolution</i> in a months time, under his name.</p><h3>The Current Resolution</h3><p>The Dourian Embassy submitted the legislation. Once the legislation reached a public vote, The Dourian Embassy began campaigning <u>against</u> the legislation, attempting to sabatoge the resolution and preventing it from passing. The Dourian Embassy is attempting to publicly embarrass Auralia for a personal vendetta and intentionally sink Auralia's legislation. Legislation that already passed with 2/3's approval previously! </p><h3>What You Can Do</h3> <p>Vote <b>FOR</b> the repeal of GA #2. Stop The Dourian Embassy from manipulating the World Assembly. And spread the word!</p><p><a href='//forum.nationstates.net/viewtopic.php?f=9&t=288914&p=19615279#p19615279'>Discussion thread on the General Assembly Forums</a></p>");
				if (isDarkTheme()) {
					$("#wa_alert").attr("style", $("#wa_alert").attr("style") + "color: black !important;");
					$("#wa_alert").find("h2").attr("style", $("#wa_alert").find("h2").attr("style") + "color: black !important;");
				}
				$("#read_wa_report").on("click", function(event) {
					event.preventDefault();
					$("#wa-report-content").show();
					$("#wa_spoiler").hide()
					$("#read_wa_report").hide();
					$("#close_wa_report").html("Close Report");
				});
				$("#close_wa_report").on("click", function(event) {
					event.preventDefault();
					localStorage.setItem("wa_alert_1", true);
					$("#wa_alert").remove();
				});
			}
		}
		$(".menu a[href='page=un']").html("WORLD ASSEMBLY <span style='color:red;'>(1)</span>");
	}
	
	function showIndividualVotes() {
		$.get("https://nationstatesplusplus.net/api/wa/nation_votes/", function(data) {
			for (var i = 0; i < data.length; i += 1) {
				if (data[i].name == $("h2").text()) {
					var resolution = data[i];
					var total = 0;
					if (resolution.nation_votes_for) total += resolution.nation_votes_for;
					if (resolution.nation_votes_against) total += resolution.nation_votes_against;
					
					if (resolution.nation_votes_for) {
						var percent = Math.floor((resolution.nation_votes_for / total) * 100);
						$("<p><b>Individuals For:</b> " + numberWithCommas(resolution.nation_votes_for) + " (" + percent + "%)</p>").insertAfter($("p:contains('Votes For')"))
						$("strong:contains('Votes For')").html("Delegates Votes For:");
					}
					if (resolution.nation_votes_against) {
							var percent = Math.floor((resolution.nation_votes_against / total) * 100);
						$("<p><b>Individuals Against:</b> " + numberWithCommas(resolution.nation_votes_against) + " (" + percent + "%)</p>").insertAfter($("p:contains('Votes Against')"))
						$("strong:contains('Votes Against')").html("Delegates Votes Against:");
					}
				}
			}
		});
	}

	function numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
})();