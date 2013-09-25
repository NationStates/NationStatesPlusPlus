(function() {
	if (getVisiblePage() == "blank" && window.location.href.indexOf("ns_settings") != -1) {
		window.document.title = "NationStates++ Settings"
		$.get("http://capitalistparadise.com/nationstates/v2_0/settings.html", function(html) {
			$("#content").html(html);
			$("#content").find("input[type='checkbox']").each(function() {
				$(this).prop("checked", isSettingEnabled($(this).attr("id"), $(this).attr("default")));
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
			var parsingError = function(error) {
				var log = "Error: " + error + "\n";
				if (typeof error != "string") {
					for (var prop in error) {
						log += "    property: " + prop + " value: [" + error[prop] + "]\n"; 
					}
				}
				$("#unparseable-span").remove();
				$("#unparseable").html($("#unparseable").html() + "<span id='unparseable-span'><pre>" + log + "</pre></span>");
				$("#unparseable").show();
				console.log(log);
			}
			$("#import_puppets_btn").on("click", function(event) {
				event.preventDefault();
				var file = document.getElementById('import_buttons').files[0];
				$("#parsed-success").hide();
				$("#unparseable").hide();
				if (file) {
					var reader = new FileReader();
					reader.readAsText(file, "UTF-8");
					reader.onload = function (evt) {
						try {
							$("#unparseable").hide();
							var split = evt.target.result.split("\n");
							var imported = false;
							for (var i = 1; i < split.length; i++) {
								var line = split[i];
								if (line.trim() != "" && line.split(",").length == 2) {
									var nation = line.split(",")[0];
									nation = nation.replaceAll('"', "").trim();
									var pass = line.split(",")[1];
									pass = pass.replaceAll('"', "").trim();
									addPuppetNation(nation.toLowerCase().split(" ").join("_"), pass);
									imported = true;
								}
							}
							if (imported) {
								$("#parsed-success").show();
							} else {
								parsingError("No data found in file");
							}
						} catch (error) {
							parsingError(error);
						}
					}
					reader.onerror = parsingError;
				} else {
					$("#unparseable").show();
				}
			});
			$("#clear_all_puppets").on("click", function(event) {
				event.preventDefault();
				if ($("#clear_all_puppets").html() != "Are You Sure?") {
					$("#clear_all_puppets").html("Are You Sure?");
					return;
				}
				var puppets = localStorage.getItem("puppets");
				var split = puppets.split(",");
				for (var i = 0; i < split.length; i++) {
					removePuppet(split[i]);
				}
				$("#clear_all_puppets").html("Clear Puppets");
			})
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
					if ($(this).attr("default") == "false") {
						localStorage.setItem($(this).attr("id"), "false");
					} else {
						localStorage.removeItem($(this).attr("id"));
					}
				});
				localStorage.setItem("settings-timestamp", Date.now());
				localStorage.removeItem("next_sync" + getUserNation());
				location.reload();
			});
		});
	}
})();