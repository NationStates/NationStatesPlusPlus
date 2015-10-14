(function() {
	if (getVisiblePage() == "dilemmas") {
		(new UserSettings()).child("dismiss_all").on(function(data) {
			$("button[name='autodismiss_issues']").remove();
			if (!data["dismiss_all"]) {
				$("<button name='autodismiss_issues' class='button danger'>Auto Dismiss All Issues</button>").insertAfter($("button[name='dismiss_all']"));
			} else {
				$("<button name='autodismiss_issues' class='button'>Cancel Dismissing All Issues</button>").insertAfter($("button[name='dismiss_all']"));
			}
		}, false);
		$("body").on("click", "button[name='autodismiss_issues']", function(event) {
			event.preventDefault();
			var enabled = $(this).html() == "Cancel Dismissing All Issues";
			(new UserSettings()).child("dismiss_all").set(!enabled);
			$(this).attr("disabled", true);
		});
	} 
})();
