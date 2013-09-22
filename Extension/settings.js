(function() {
	if (getVisiblePage() == "blank" && window.location.href.indexOf("ns_settings") != -1) {
		window.document.title = "NationStates++ Settings"
		$.get("http://capitalistparadise.com/nationstates/v2_0/settings.html", function(html) {
			$("#content").html(html);
			$("#content").find("input[type='checkbox']").each(function() {
				$(this).prop("checked", isSettingEnabled($(this).attr("id")));
			});
			//var blob = new Blob(["Hello, world!"], {type: "text/plain;charset=utf-8"});
			//saveAs(blob, "hello world.txt");
			$("#export_puppets").on("click", function(event) {
				event.preventDefault();
				var puppetArr = new Array();
				var puppets = localStorage.getItem("puppets");
				if (puppets == null) puppets = "";
				var split = puppets.split(",");
				puppetArr.push('"Nation", "Password"\n');
				for (var i = 0; i < split.length; i++) {
					var name = split[i];
					if (name.length > 0) {
						puppetArr.push('"' + name.replaceAll("_", " ").toTitleCase() + '", "' + localStorage.getItem("puppet-" + name) + '"\n');
					};
				}
				var blob = new Blob(puppetArr, {type: "text/plain;charset=utf-8"});
				saveAs(blob, "puppets.csv");
			});
			$("#import_puppets_btn").on("click", function(event) {
				event.preventDefault();
				var file = document.getElementById('import_buttons').files[0];
				if (file) {
					var reader = new FileReader();
					reader.readAsText(file, "UTF-8");
					reader.onload = function (evt) {
						try {
							$("#unparseable").hide();
							var split = evt.target.result.split("\n");
							for (var i = 1; i < split.length; i++) {
								var line = split[i];
								var nation = line.split(",")[0];
								nation = nation.substring(1, nation.length - 1);
								var pass = line.split(",")[1];
								pass = pass.substring(2, pass.length - 1);
								addPuppetNation(nation.toLowerCase().split(" ").join("_"), pass);
							}
						} catch (error) {
							$("#unparseable").show();
							console.log(error);
						}
					}
					reader.onerror = function (evt) {
						console.log(evt);
					}
				} else {
					$("#unparseable").show();
				}
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
		window.document.title = "NationStates++ Server Stats"
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