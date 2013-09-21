(function() {
	if (getVisiblePage() == "blank" && window.location.href.indexOf("ns_settings") != -1) {
		$.get("http://capitalistparadise.com/nationstates/v2_0/settings.html", function(html) {
			$("#content").html(html);
			$("#content").find("input[type='checkbox']").each(function() {
				$(this).prop("checked", isSettingEnabled($(this).attr("id")));
			});
			$("#save_settings").on("click", function(event) {
				event.preventDefault();
				$("#content").find("input[type='checkbox']").each(function() {
					localStorage.setItem($(this).attr("id"), $(this).prop("checked"));
				});
				localStorage.setItem("settings-timestamp", Date.now());
				localStorage.removeItem("next_sync" + getUserNation());
				location.reload();
			});
			$("#reset_settings").on("click", function(event) {
				event.preventDefault();
				if ($("#reset_settings").html() != "Are You Sure?") {
					$("#reset_settings").html("Are You Sure?");
					return;
				}
				$("#content").find("input[type='checkbox']").each(function() {
					localStorage.removeItem($(this).attr("id"));
				});
				localStorage.setItem("settings-timestamp", Date.now());
				localStorage.removeItem("next_sync" + getUserNation());
				location.reload();
			});
		});
	}
	if (getVisiblePage() == "blank" && window.location.href.indexOf("show_server_stats") != -1) {
		$("#content").html("<h1>NationStates++ Server Statistics</h1><div id='server_stats'></div>");
		var cpu = '<iframe src="https://rpm.newrelic.com/public/charts/7WJapKYtFih" width="500" height="300" scrolling="no" frameborder="no"></iframe>';
		var memory = '<iframe src="https://rpm.newrelic.com/public/charts/6pDIb1fy4n7" width="500" height="300" scrolling="no" frameborder="no"></iframe>';
		var disk = '<iframe src="https://rpm.newrelic.com/public/charts/3kGBkWVkkQD" width="500" height="300" scrolling="no" frameborder="no"></iframe>';
		var network = '<iframe src="https://rpm.newrelic.com/public/charts/jllI6ankuA5" width="500" height="300" scrolling="no" frameborder="no"></iframe>';
		var connections = '<iframe src="https://rpm.newrelic.com/public/charts/8SAAJiklSTl" width="500" height="300" scrolling="no" frameborder="no"></iframe>';
		var requests = '<iframe src="https://rpm.newrelic.com/public/charts/5DfbHGNVIVM" width="500" height="300" scrolling="no" frameborder="no"></iframe>';
		$("#server_stats").html(cpu + memory + disk + network + connections + requests);
	}
})();