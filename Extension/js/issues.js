(function() {
	if (getVisiblePage() == "dilemmas") {
		$("button[name='dismiss_all']").on('click', function() {
			$(".dilemmalist").find("a").each(function() {
				var search = "page=show_dilemma/dilemma=";
				var index = $(this).attr('href').indexOf(search);
				if (index > -1) {
					var dilemma = $(this).attr('href').substring(index + search.length);
					selectOption(-1, dilemma);
				}
			});
		});
		if (!getUserData().getValue("dismiss_all", false)) {
			$("<button name='autodismiss_issues' class='button danger'>Auto Dismiss All Issues</button>").insertAfter($("button[name='dismiss_all']"));
		} else {
			$("<button name='autodismiss_issues' class='button'>Cancel Dismissing All Issues</button>").insertAfter($("button[name='dismiss_all']"));
		}
		getUserData().update(function() {
			if (!getUserData().getValue("dismiss_all", false)) {
				$("button[name='autodismiss_issues']").html("Auto Dismiss All Issues").addClass("danger");
			} else {
				$("button[name='autodismiss_issues']").html("Cancel Dismissing All Issues").removeClass("danger");
			}
			$("button[name='autodismiss_issues']").on('click', function() {
				var userData = getUserData();
				userData.setValue("dismiss_all", !userData.getValue("dismiss_all", false));
				$(this).attr("disabled", true);
				userData.pushUpdate(function() {
					if (!getUserData().getValue("dismiss_all", false)) {
						$("button[name='autodismiss_issues']").html("Auto Dismiss All Issues").addClass("danger");
					} else {
						$("button[name='autodismiss_issues']").html("Cancel Dismissing All Issues").removeClass("danger");
					}
					$("button[name='autodismiss_issues']").attr("disabled", false);
				});
			});
		});
	} else if (getVisiblePage() == "show_dilemma") {
		if (getVisibleDilemma() == 230) {
			$("<div style='height: 250px; width: 100%; background-image: linear-gradient(-45deg, rgba(255, 255, 0, 1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 0, 1) 50%, rgba(255, 255, 0, 1) 75%, transparent 75%, transparent); background-color: #F00; background-size: 50px 50px;'><div style='height: 1%;'></div><div id='warning-text-container' style='width: 98%; height: 90%; background: white; margin: 1%;'><img src='http://nationstatesplusplus.net/nationstates/static/trap.png' style='height: 223px; border: 1px solid black;'/><span id='warning-text' style='position:absolute; color:black; margin-left: 4px;'></span></div></div>").insertBefore("h5:first");
			updateSize = function() {
				$("#warning-text").css("height", $("#warning-text-container").height() + "px").css("width", ($("#warning-text-container").width() - 175) + "px");
				$("#warning-text").removeAttr("boxfitted");
				$("#warning-text").html("<b>WARNING:</b> This issue and  choices are poorly worded and will almost certainly not have the intended results. It has been constructed to intentionally trap nations with vaguely worded options and illogical outcomes. It is <i>strongly</i> recommended that this issue be dismissed with prejudice. Answer the options at your own risk!");
				textFit($("#warning-text")[0]);
			}
			window.onresize = updateSize;
			updateSize();
		}
		getUserData().update(function() {
			var nationData = getUserData();
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
		});
		$('body').on('click', 'button', function() {
			event.preventDefault();
			console.log("Selecting issue");
			var choice = $(this).prop('name') == "choice--1" ? -1 : parseInt($(this).prop('name').split("-")[1]);
			selectOption(choice, getVisibleDilemma());
			$(".diloptions li").removeClass("chosendiloption");
			$(".diloptions li").find("em").parent().remove();
			var government = "The government is preparing to dismiss this issue.";
			if (choice > -1) {
				government = "The government has indicated its intention to follow the recommendations of Option " + (choice + 1) + ".";
				$(this).parents("li").addClass("chosendiloption");
				$(this).parents("li").append("<p><em>This is the position your government is preparing to adopt.</em></p>");
			}
			var choice = 0;
			$(".diloptions li").each(function() {
				if ($(this).find("button").length == 0) {
					$(this).append("<p><button type='submit' name='choice-" + choice + "' value='1' class='button icon approve'>Accept</button></p>");
				}
				choice += 1;
			});
			$("button[type='submit']").show();
			$(this).hide();
			$("h5:contains('The Government Position')").next().html(government);
		});
	}
})();

function selectOption(choice, issueNumber) {
	getUserData().update(function() {
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
		nationData.pushUpdate(function() { updateNSOption(choice) });
	});
}

function updateNSOption(choice) {
	$.post(window.location.href, "choice-" + choice + "=1", function() { });
}
