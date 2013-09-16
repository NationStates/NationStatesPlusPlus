(function() {
	if (getVisiblePage() == "dossier") {
		console.log("Hello Dossier!");
		$("table:first").find("tr:first").append("<th>Alias</th><th>Notes</th>");
		$("table:first").find("tbody").find("tr").each(function() {
			var nation = $(this).find(".nlink:first").attr("href"
		});
	}
})();

function showSuggestions() {
	if ($("#nationstates_suggestions").length == 0) {
		var forums = $("#wrap").length == 1;
		$.get("http://capitalistparadise.com/nationstates/v1_9/suggestions.html", function(data) {
			if (forums) {
				var html = $("#wrap").html();
				var classes = $("#wrap").attr('class');
				$("#wrap").remove();
				$("<div id='main'><div id='wrap' class='" + classes + "'>" + html + "</div></div>").insertAfter("#nssidebar, #nstopbar");
			} else if (isAntiquityTheme()) {
				var html = $("#main").html();
				$("#main").remove();
				$("<div id='main'><div id='wrap'>" + html + "</div></div>").insertAfter("#banner");
			}
			$("#main").html($("#main").html() + "<div id='nationstates_suggestions'><div>");
			$("#nationstates_suggestions").html(data);
			if (isAntiquityTheme() && !forums) {
				$("#nationstates_suggestions").css("margin-left", "0");
			}
			$("#nationstates_suggestions").hide();
			showSuggestions();
		});
	} else {
		$("#content, #wrap").hide();
		$("#nationstates_settings").hide();
		$("#nationstates_suggestions").show();
	}
}