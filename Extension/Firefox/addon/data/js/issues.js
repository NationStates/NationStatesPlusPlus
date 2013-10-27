(function() {
	if (getVisiblePage() == "dilemmas") {
		$("button").on('click', function() {
			$(".dilemmalist").find("a").each(function() {
				var search = "page=show_dilemma/dilemma=";
				var index = $(this).attr('href').indexOf(search);
				if (index > -1) {
					var dilemma = $(this).attr('href').substring(index + search.length);
					selectOption(-1, dilemma);
				}
			});
		});
	} else if (getVisiblePage() == "show_dilemma") {
		if (getVisibleDilemma() == 230) {
			$("<div style='height: 250px; width: 100%; background-image: linear-gradient(-45deg, rgba(255, 255, 0, 1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 0, 1) 50%, rgba(255, 255, 0, 1) 75%, transparent 75%, transparent); background-color: #F00; background-size: 50px 50px;'><div style='height: 1%;'></div><div id='warning-text-container' style='width: 98%; height: 90%; background: white; margin: 1%;'><img src='http://capitalistparadise.com/nationstates/static/trap.png' style='height: 223px; border: 1px solid black;'/><span id='warning-text' style='position:absolute; color:black; margin-left: 4px;'></span></div></div>").insertBefore("h5:first");
			updateSize = function() {
				$("#warning-text").css("height", $("#warning-text-container").height() + "px").css("width", ($("#warning-text-container").width() - 175) + "px");
				$("#warning-text").removeAttr("boxfitted");
				$("#warning-text").html("<b>WARNING:</b> This issue and  choices are poorly worded and will almost certainly not have the intended results. It has been constructed to intentionally trap nations with vaguely worded options and illogical outcomes. It is <i>strongly</i> recommended that this issue be dismissed with prejudice. Answer the options at your own risk!");
				textFit($("#warning-text")[0]);
			}
			window.onresize = updateSize;
			updateSize();
		}
		var nationData = getUserData();
		nationData.update();
		if (nationData.getValue("issues", {})[getVisibleDilemma()] != null) {
			var choices = nationData.getValue("issues", {})[getVisibleDilemma()];
			for (var i = 0; i < choices.length; i++) {
				var decision = choices[i];
				if ($("button[name=choice-" + decision.choice + "]").length != 0) {
					var parent = $("button[name=choice-" + decision.choice + "]").parent();
					var date = new Date(parseInt(decision.timestamp) * 1000);
					if (date.getTime() + 24 * 60 * 60 * 1000 < Date.now()) {
						if (parent.find("span[name='choice-" + decision.choice + "']").length == 0) {
							$(parent).html($(parent).html() + "<span name='choice-" + decision.choice + "' style='font-style:italic; font-size:11px; margin-left: 10px;'>Your government previously enacted this option on " + date.customFormat("#MMM# #DD#, #YYYY#") + "</span>");
						} else {
							parent.find("span[name='choice-" + decision.choice + "']").html("Your government previously enacted this option multiple times, most recently on " + date.customFormat("#MMM# #DD#, #YYYY#"));
						}
					}
				}
			}
		}
		$("button").on('click', function() {
			selectOption($(this).prop('name') == "choice--1" ? -1 : parseInt($(this).prop('name').split("-")[1]), getVisibleDilemma());
		});
	}
})();

function selectOption(choice, issueNumber) {
	var nationData = getUserData();
	var issues = nationData.getValue("issues", {});
	var now = Math.floor(Date.now() / 1000);
	if (issues[issueNumber] == null) {
		issues[issueNumber] = [];
	} else {
		for (var i = 0; i < issues[issueNumber].length; i++) {
			if (issues[issueNumber][i].timestamp + 12 * 60 * 60 > now) {
				issues[issueNumber].splice(i, 1);
			}
		}
	}
	issues[issueNumber].push({timestamp: now, choice: choice});
	nationData.pushUpdate();
}
