(function() {
	if (getVisiblePage() == "region_control") {
		$("<div id='regional_newspaper'></div>").insertBefore("h4:contains('Welcome Telegrams')");
		$("#regional_newspaper").html("<h4>Regional Newspaper</h4>");
		$.get("http://capitalistparadise.com/api/newspaper/region/?region=" + getVisibleRegion() + "&time=" + Date.now(), function(data) {
			$("#regional_newspaper").append("<button id='disband_news' class='button danger'>Disband Regional Newspaper</button><span id='lack_authority' style='display:none;margin-left: 5px;color:red;'>You do not have authority to disband.</span><span id='disbanded_success' style='display:none;margin-left: 5px;color:green;'>The regional newspaper has been disbanded.</span>");
			$("#disband_news").on("click", function(event) {
				event.preventDefault();
				doAuthorizedPostRequest("http://www.capitalistparadise.com/api/newspaper/disband/?region=" + getVisibleRegion(), "", function(data) {
					$("#disband_news").toggleDisabled();
					$("#disbanded_success").show();
				}, function() {
					$("#lack_authority").show();
					$("#disband_news").toggleDisabled();
				});
			});
		}).fail(function() {
			$("#regional_newspaper").append("<button id='found_news' class='button'>Found Regional Newspaper</button><span id='lack_authority' style='display:none;margin-left: 5px;color:red;'>You do not have authority.</span>");
			$("#found_news").on("click", function(event) {
				event.preventDefault();
				doAuthorizedPostRequest("http://www.capitalistparadise.com/api/newspaper/found/?region=" + getVisibleRegion(), "", function(json) {
					window.location.href = "http://www.nationstates.net/page=blank?manage_newspaper=" + json.newspaper_id;
				}, function() {
					$("#lack_authority").show();
					$("#found_news").toggleDisabled();
				});
			});
		});
	}
})();