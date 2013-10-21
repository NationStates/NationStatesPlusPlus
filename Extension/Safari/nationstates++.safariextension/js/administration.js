(function() {
	if (getVisiblePage() == "region_control") {
		$("<div id='regional_newspaper'></div>").insertBefore("h4:contains('Welcome Telegrams')");
		$("#regional_newspaper").html("<h4>Regional Newspaper</h4>");
		$.get("http://capitalistparadise.com/api/newspaper/region/?region=" + getVisibleRegion() + "&time=" + Date.now(), function(data) {
			$("#regional_newspaper").append("<button id='disband_news' class='button danger'>Disband Regional Newspaper</button><span id='lack_authority' style='display:none;margin-left: 5px;color:red;'>You do not have authority to disband.</span><span id='disbanded_success' style='display:none;margin-left: 5px;color:green;'>The regional newspaper has been disbanded.</span>");
			$("#disband_news").on("click", function(event) {
				event.preventDefault();
				getNationStatesAuth(function(authCode) {
					var authToken = localStorage.getItem(getUserNation() + "-auth-token");
					var postData = "nation=" + getUserNation() + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "");
					$.post("http://www.capitalistparadise.com/api/newspaper/disband/?region=" + getVisibleRegion(), postData, function(data) {
						$("#disband_news").toggleDisabled();
						$("#disbanded_success").show();
					}).fail(function() {
						$("#lack_authority").show();
						$("#disband_news").toggleDisabled();
					});
				});
			});
		}).fail(function() {
			$("#regional_newspaper").append("<button id='found_news' class='button'>Found Regional Newspaper</button><span id='lack_authority' style='display:none;margin-left: 5px;color:red;'>You do not have authority.</span>");
			$("#found_news").on("click", function(event) {
				event.preventDefault();
				getNationStatesAuth(function(authCode) {
					var authToken = localStorage.getItem(getUserNation() + "-auth-token");
					var postData = "nation=" + getUserNation() + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "");
					$.post("http://www.capitalistparadise.com/api/newspaper/found/?region=" + getVisibleRegion(), postData, function(json) {
						window.location.href = "http://www.nationstates.net/page=blank?manage_newspaper=" + json.newspaper_id;
					}).fail(function() {
						$("#lack_authority").show();
						$("#found_news").toggleDisabled();
					});
				});
			});
		});
	}
})();