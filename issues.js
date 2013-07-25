(function() {
	if (getVisiblePage() == "dilemmas") {
		$("button").on('click', function() {
			$(".dilemmalist").find("a").each(function() {
				var search = "page=show_dilemma/dilemma=";
				var index = $(this).attr('href').indexOf(search);
				if (index > -1) {
					var dilemma = $(this).attr('href').substring(index + search.length);
					console.log("Dilemma: " + dilemma);
					selectOption("choice--1", dilemma);
				}
			});
		});
	} else if (getVisiblePage() == "show_dilemma") {
		for (var i = -1; i <= 9; i++) {
			var key = "issue-" + getVisibleDilemma() + "-" + getUserNation() + "-choice-" + i;
			var previous = localStorage.getItem(key);
			if (previous != null && $("button[name=choice-" + i + "]").length != 0) {
				var parent = $("button[name=choice-" + i + "]").parent();
				var split = previous.split(",");
				var date = new Date(parseInt(split[split.length - 1]) * 1000);
				if (split.length == 1) {
					$(parent).html($(parent).html() + "<div style='display:inline; font-style:italic; font-size:11px; margin-left: 10px;'>Your goverment previously enacted this option on " + date.customFormat("#MMM# #DD#, #YYYY#") + "</div>");
				} else {
					$(parent).html($(parent).html() + "<div style='display:inline; font-style:italic; font-size:11px; margin-left: 10px;'>Your goverment previously enacted this option " + split.length + " times, most recently on " + date.customFormat("#MMM# #DD#, #YYYY#") + "</div>");
				}
			}
		}
		$("button").on('click', function() {
			console.log("clicking issue");
			selectOption($(this).prop('name'), getVisibleDilemma());
		});
		console.log($("button"));
	}
})();

function selectOption(choice, issueNumber) {
	var now = Math.floor(Date.now() / 1000);
	for (var i = -1; i <= 9; i++) {
		var key = "issue-" + issueNumber + "-" + getUserNation() + "-choice-" + i;
		var previous = localStorage.getItem(key);
		if (previous != null) {
			var split = previous.split(",");
			var rebuilt = "";
			for (var j = 0; j < split.length; j++) {
				var time = parseInt(split[j]);
				if (now < (time + 12 * 60 * 60)) {
					console.log("cur time: " + now + " is within 12 hours of old answer, discarding: " + time);
				} else {
					if (rebuilt.length != 0) rebuilt += ",";
					rebuilt += split[j];
				}
			}
			if (rebuilt.length != 0) {
				localStorage.setItem(key, rebuilt);
			} else {
				localStorage.removeItem(key);
			}
			//Remove now, will be set once as clicking a button forces a navigation and thus a resync
			try {
				(new Firebase("https://nationstatesplusplus.firebaseio.com/nation/" + getUserNation() + "/")).child("issues").child(issueNumber).child("choice-" + i).remove();
			} catch (error) {
				console.log(error);
			}
		}
	}
	var key = "issue-" + issueNumber + "-" + getUserNation() + "-" + choice;
	var previous = localStorage.getItem(key);
	if (previous != null) {
		previous += "," + now;
	} else {
		previous = now;
	}
	console.log("Setting issue: " + key + " to : " + previous);
	localStorage.setItem(key, previous);
}
