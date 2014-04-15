(function() {
	if (getVisiblePage() == "ga" || getVisiblePage() == "sc") {
		if ($("h3:contains('Resolution At Vote')").length > 0) {
			var resolution = $("h2").text();
			if (resolution) {
				showIndividualVotes();
			}
		}
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