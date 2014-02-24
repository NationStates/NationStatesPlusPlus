(function() {
	if (getVisiblePage() == "dilemmas") {
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
			$("<div style='height: 250px; width: 100%; background-image: linear-gradient(-45deg, rgba(255, 255, 0, 1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 0, 1) 50%, rgba(255, 255, 0, 1) 75%, transparent 75%, transparent); background-color: #F00; background-size: 50px 50px;'><div style='height: 1%;'></div><div id='warning-text-container' style='width: 98%; height: 90%; background: white; margin: 1%;'><img src='https://nationstatesplusplus.net/nationstates/static/trap.png' style='height: 223px; border: 1px solid black;'/><span id='warning-text' style='position:absolute; color:black; margin-left: 4px;'></span></div></div>").insertBefore("h5:first");
			updateSize = function() {
				$("#warning-text").css("height", $("#warning-text-container").height() + "px").css("width", ($("#warning-text-container").width() - 175) + "px");
				$("#warning-text").removeAttr("boxfitted");
				$("#warning-text").html("<b>WARNING:</b> This issue and  choices are poorly worded and will almost certainly not have the intended results. It has been constructed to intentionally trap nations with vaguely worded options and illogical outcomes. It is <i>strongly</i> recommended that this issue be dismissed with prejudice. Answer the options at your own risk!");
				textFit($("#warning-text")[0]);
			}
			window.onresize = updateSize;
			updateSize();
		}

		//if (getUserData(true).getValue("issues") != null) {
		//	getUserData(true).setValue("issues", null);
		//}
	}
})();