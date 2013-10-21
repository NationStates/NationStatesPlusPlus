(function() {
	if (getVisiblePage() == "help") {
		var previousRequests = localStorage.getItem("previous-problems-" + getUserNation());
		if (previousRequests != null) {
			var requests = JSON.parse(previousRequests);
			var html = "<div class='hzln'></div><h2>Previous Reports</h2><ul>";
			for (var request in requests) {
				var requestBody = requests[request];
				var date = new Date(parseInt(requestBody['timestamp']));
				html += "<li style='font-style: italic;'><a href='javascript:void(0)' onclick='return showItem(" + requestBody['timestamp'] + ");'>Your report on " + date.customFormat("#MMM# #DD#, #YYYY# #h#:#m# #AMPM#") + "</a><fieldset id='" + requestBody['timestamp'] + "' class='wfe' style='margin-top:10px; display:none;'><h3 style='line-height: 0;'>Problem: " + requestBody['problem'] + "</h3><b>Description:</b><p>" + requestBody['body'] + "</p><p><b>Region: " + requestBody['region'] + "</b></p></fieldset></li>";
			}
			html += "</ul>";
			$(html).insertBefore(".hzln");
		}

		//Add click handler
		$("input[value='Lodge Request']").changeElementType("button");
		$("button[value='Lodge Request']").html("Lodge Request").attr("class", "button").css("font-weight", "bold").on('click', function() {
			var requestBody = new Object();
			var time = Date.now();
			requestBody['timestamp'] = time;
			requestBody['problem'] = $("option[value='" + $("select[name='problem']").val() + "']").html();
			requestBody['body'] = $("textarea[name='comment']").val().split("\n").join("<br/>");
			requestBody['region'] = $("input[name='rname']").val();
			var previousRequests = localStorage.getItem("previous-problems-" + getUserNation());
			if (previousRequests == null) {
				previousRequests = new Object();
			} else {
				previousRequests = JSON.parse(previousRequests);
			}
			previousRequests[time] = requestBody;
			localStorage.setItem("previous-problems-" + getUserNation(), JSON.stringify(previousRequests));
		});
	}

})();
function showItem(item) {
	$("#" + item).animate({ height: 'toggle' });
}