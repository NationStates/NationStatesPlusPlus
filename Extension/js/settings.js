(function() {
	if (getUserNation() != "") {
		//Migrate old settings
		if (localStorage.getItem("embassy_flags") != null) {
			getSettings();
			//cleanup unused data
			for (var key in localStorage) {
				if (localStorage.hasOwnProperty(key)) {
					if (key.startsWith("auth-") || key.startsWith("firebase-auth-") || key == "gameplay_enhancements" 
					|| key == "ns_fall_survey" || key == "region_enhancements" || key.startsWith("report_") || key.startsWith("next_sync")) {
						localStorage.removeItem(key);
					}
					if (key.startsWith("issue-")) {
						var split = key.split("-");
						var issue = split[1];
						var nation = split[2];
						var choice = (key.endsWith("--1") ? -1 : split[split.length - 1]);
						var timestamps = localStorage.getItem(key).split(",");
						var nationData = localStorage.getItem(nation + "-data");
						if (nationData == null) {
							nationData = {};
							nationData.userData = {};
							nationData.userData.issues = { };
						} else {
							nationData = JSON.parse(nationData);
						}
						var issueData = nationData.userData.issues[issue];
						if (issueData == null) {
							issueData = [];
						}
						for (var i = 0; i < timestamps.length; i++) {
							var timestamp = timestamps[i];
							issueData.push({timestamp: timestamp, choice: choice});
						}
						nationData.userData.issues[issue] = issueData;
						localStorage.setItem(nation + "-data", JSON.stringify(nationData));
						localStorage.removeItem(key);
					} else if (key.startsWith("previous-problems-")) {
						var split = key.split("-");
						var nation = split[2];
						var nationData = localStorage.getItem(nation + "-data");
						if (nationData == null) {
							nationData = {};
							nationData.userData = {};
							nationData.userData.issues = { };
						} else {
							nationData = JSON.parse(nationData);
						}
						nationData.userData.ghr = JSON.parse(localStorage.getItem(key));
						localStorage.setItem(nation + "-data", JSON.stringify(nationData));
						localStorage.removeItem(key);
					}
				}
			}
			var settings = { };
			var options = { };
			settings["last_update"] = Date.now();
			var getAndRemove = function(key) {
				var prev = localStorage.getItem(key);
				localStorage.removeItem(key);
				return prev;
			}
			options["embassy_flags"] = (getAndRemove("embassy_flags") != "false");
			options["search_rmb"] = (getAndRemove("search_rmb") != "false");
			options["infinite_scroll"] = (getAndRemove("infinite_scroll") != "false");
			options["show_ignore"] = (getAndRemove("show_ignore") != "false");
			options["auto_update"] = (getAndRemove("auto_update") != "false");
			options["clickable_links"] = (getAndRemove("clickable_links") != "false");
			options["hide_ads"] = (getAndRemove("hide_ads") != "false");
			options["scroll_nation_lists"] = (getAndRemove("scroll_nation_lists") != "false");
			options["clickable_telegram_links"] = (getAndRemove("clickable_telegram_links") != "false");
			options["show_puppet_switcher"] = (getAndRemove("show_puppet_switcher") != "false");
			options["fancy_dossier_theme"] = (getAndRemove("fancy_dossier_theme") != "false");
			options["use_nationstates_api"] = (getAndRemove("use_nationstates_api") != "false");
			options["show_gameplay_news"] = (getAndRemove("show_gameplay_news") != "false");
			options["show_roleplay_news"] = (getAndRemove("show_roleplay_news") != "false");
			options["show_regional_news"] = (getAndRemove("show_regional_news") != "false");
			options["irc_username_override"] = getAndRemove("irc_username_override");
			options["irc_network_override"] = getAndRemove("irc_network_override");
			options["redirect-puppet-page"] = (getAndRemove("redirect-puppet-page") != "false");
			options["autologin-puppets"] = (getAndRemove("autologin-puppets") != "false");
			options["show-region-on-hover"] = (getAndRemove("show-region-on-hover") != "false");
			options["egosearch_ignore"] = (getAndRemove("egosearch_ignore") != "false");
			options["post_ids"] = (getAndRemove("post_ids") != "false");
			options["show_irc"] = (getAndRemove("show_irc") != "false");
			settings["settings"] = options;
			
			options.newspapers = {};
			for (var key in localStorage) {
				if (localStorage.hasOwnProperty(key)) {
					if (key.startsWith("last_read_newspaper")) {
						var id = key.split("-")[1];
						if (isNumber(id)) {
							options.newspapers[id] = getAndRemove(key);
						} else {
							localStorage.removeItem(key);
						}
					}
				}
			}
			
			localStorage.setItem("settings", JSON.stringify(settings));
			
			var api = getSettings();
			api.pushUpdate();
		}
	}
	if (getVisiblePage() == "blank" && window.location.href.indexOf("ns_settings") != -1) {
		window.document.title = "NationStates++ Settings"
		$("#content").html("<div style='margin-top: 25px; margin-left:15px; font-weight:bold; font-size:16px;'><img style='margin-bottom: -2px; margin-right: 4px;' src='/images/loading1.gif'>Loading...</span>");
		getSettings().update(function() {
			$.get("http://nationstatesplusplus.net/nationstates/v2_1/settings.html?v=1", function(html) {
				$("#content").html(html);
				$("#content").find("input[type='checkbox']").each(function() {
					var settings = getSettings();
					$(this).prop("checked", settings.isEnabled($(this).attr("id"), $(this).attr("default")));
				});
				$("#content").find("input[type='text']").each(function() {
					$(this).val(getSettings().getValue($(this).attr("id"), ""));
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
				});
				$("#save_settings").on("click", function(event) {
					event.preventDefault();
					var settings = getSettings();
					$("#content").find("input[type='checkbox']").each(function() {
						settings.setValue($(this).attr("id"), $(this).prop("checked"));
					});
					$("#content").find("input[type='text']").each(function() {
						if ($(this).val() != "") {
							settings.setValue($(this).attr("id"), $(this).val());
						} else {
							settings.setValue($(this).attr("id"), null);
						}
					});
					settings.pushUpdate(function() {
						location.reload();
					});
				});
				$("#reset_settings").on("click", function(event) {
					event.preventDefault();
					if ($("#reset_settings").html() != "Are You Sure?") {
						$("#reset_settings").html("Are You Sure?");
						return;
					}
					var settings = getSettings();
					$("#content").find("input[type='checkbox']").each(function() {
						if ($(this).attr("default") == "false") {
							settings.setValue($(this).attr("id"), "false");
						} else {
							settings.setValue($(this).attr("id"), null);
						}
					});
					$("#content").find("input[type='text']").each(function() {
						settings.setValue($(this).attr("id"), null);
					});

					settings.pushUpdate(function() {
						location.reload();
					});
				});
			});
		});
	}
})();