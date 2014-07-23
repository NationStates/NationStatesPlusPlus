(function() {
	if (getVisiblePage() == "help") {
		var requests = localStorage.getItem("ghr");
		if (requests != null) {
			requests = JSON.parse(requests);
		} else {
			requests = {};
		}
		var html = "<div class='hzln'></div><h2>Previous Reports</h2><ul>";
		for (var request in requests) {
			var requestBody = requests[request];
			var date = new Date(requestBody['timestamp']);
			html += "<li style='font-style: italic;'><a class='" + requestBody['timestamp'] + "' href='javascript:void(0)'>Your report on " + date.customFormat("#MMM# #DD#, #YYYY# #h#:#m# #AMPM#") + "</a><fieldset id='" + requestBody['timestamp'] + "' class='wfe' style='margin-top:10px; display:none;'><h3 style='line-height: 0;'>Problem: " + requestBody['problem'] + "</h3><b>Description:</b><p>" + requestBody['body'] + "</p><p><b>Region: " + requestBody['region'] + "</b></p></fieldset></li>";
		}
		html += "</ul>";
		$(html).insertBefore(".hzln");
		for (var request in requests) {
			var requestBody = requests[request];
			$("a." + requestBody['timestamp']).on("click", function(event) {
				event.preventDefault();
				$("#" + $(this).attr("class")).animate({ height: 'toggle' });
			})
		}
		$("textarea").width(700);
		//Add click handler
		$("input[value='Lodge Request']").changeElementType("button");
		$("button[value='Lodge Request']").html("Lodge Request").attr("class", "button").css("font-weight", "bold").on('click', function() {
			var requestBody = {}
			var time = Date.now();
			requestBody['timestamp'] = time;
			requestBody['problem'] = $("option[value='" + $("select[name='problem']").val() + "']").html();
			requestBody['body'] = $("textarea[name='comment']").val().split("\n").join("<br/>");
			requestBody['region'] = $("input[name='rname']").val();
			
			var requests = localStorage.getItem("ghr");
			if (requests != null) {
				requests = JSON.parse(requests);
			} else {
				requests = {};
			}
			requests[time] = requestBody;
			localStorage.setItem("ghr", JSON.stringify(requests));
		});
		
		if (window.location.href.contains("?recruitment")) {
			$("select").val(9);
			$("textarea").val("Hi,\n\nI'm interested in obtaining a telegram API key for my region. I plan using the API key for recruitment purposes, for my region, " + getUserRegion().replaceAll("_", " ").toTitleCase() +
			". I will be the nation responsible for the use of the API key.\n\nThanks!\n\n" + getUserNation().replaceAll("_", " ").toTitleCase());
		}
	}
})();