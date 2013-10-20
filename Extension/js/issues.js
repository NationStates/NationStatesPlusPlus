(function() {
	if (getVisiblePage() == "dilemmas") {
		$("button").on('click', function() {
			$(".dilemmalist").find("a").each(function() {
				var search = "page=show_dilemma/dilemma=";
				var index = $(this).attr('href').indexOf(search);
				if (index > -1) {
					var dilemma = $(this).attr('href').substring(index + search.length);
					selectOption("choice--1", dilemma);
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
		for (var i = -1; i <= 9; i++) {
			var key = "issue-" + getVisibleDilemma() + "-" + getUserNation() + "-choice-" + i;
			var previous = localStorage.getItem(key);
			if (previous != null && $("button[name=choice-" + i + "]").length != 0) {
				var parent = $("button[name=choice-" + i + "]").parent();
				var split = previous.split(",");
				var date = new Date(parseInt(split[split.length - 1]) * 1000);
				if (date.getTime() + 24 * 60 * 60 * 1000 < Date.now()) {
					if (split.length == 1) {
						$(parent).html($(parent).html() + "<div style='display:inline; font-style:italic; font-size:11px; margin-left: 10px;'>Your goverment previously enacted this option on " + date.customFormat("#MMM# #DD#, #YYYY#") + "</div>");
					} else {
						$(parent).html($(parent).html() + "<div style='display:inline; font-style:italic; font-size:11px; margin-left: 10px;'>Your goverment previously enacted this option " + split.length + " times, most recently on " + date.customFormat("#MMM# #DD#, #YYYY#") + "</div>");
					}
				}
			}
		}
		$("button").on('click', function() {
			selectOption($(this).prop('name'), getVisibleDilemma());
		});
	}
})();

function selectOption(choice, issueNumber) {
	localStorage.removeItem("next_sync" + getUserNation());
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
					//console.log("cur time: " + now + " is within 12 hours of old answer, discarding: " + time);
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
			localStorage.setItem("remove-issue", issueNumber + ":" + "choice-" + i);
		}
	}
	var key = "issue-" + issueNumber + "-" + getUserNation() + "-" + choice;
	var previous = localStorage.getItem(key);
	if (previous != null) {
		previous += "," + now;
	} else {
		previous = now;
	}
	localStorage.setItem(key, previous);
}
