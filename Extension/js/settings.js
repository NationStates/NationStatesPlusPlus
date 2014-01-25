//Stolen from Modernzr, MIT licensed:
var supportsColorInput = (function() {
	var inputElem = document.createElement('input'), bool, docElement = document.documentElement, smile = ':)';
	inputElem.setAttribute('type', 'color');
	bool = inputElem.type !== 'text';
	// We first check to see if the type we give it sticks..
	// If the type does, we feed it a textual value, which shouldn't be valid.
	// If the value doesn't stick, we know there's input sanitization which infers a custom UI
	if (bool) {
		inputElem.value         = smile;
		inputElem.style.cssText = 'position:absolute;visibility:hidden;';
		docElement.appendChild(inputElem);
		docElement.offsetWidth;
		bool = inputElem.value != smile;
		docElement.removeChild(inputElem);
	}
	return bool;
})();

(function() {
	if (getUserNation() != "") {
		if (getSettings().last_update + 300000 < Date.now()) {
			getSettings().update(function() {console.log("Updating settings...")});
		}
		if (getUserData().last_update + 300000 < Date.now()) {
			getUserData().update(function() {console.log("Updating user data...")});
		}
	}
	if (getVisiblePage() == "blank" && window.location.href.indexOf("ns_settings") != -1) {
		window.document.title = "NationStates++ Settings"
		$("#content").html("<div style='margin-top: 25px; margin-left:15px; font-weight:bold; font-size:16px;'><img style='margin-bottom: -2px; margin-right: 4px;' src='/images/loading1.gif'>Loading...</span>");
		getSettings().update(function() {
			$.get("http://nationstatesplusplus.net/nationstates/v2_3/settings.html?v=4", function(html) {
				$("#content").html(html);
				if (!window.chrome) {
					$("div[name='chrome_only']").hide();
				}
				if (supportsColorInput) {
					$("input[type='color']").css("width", "15px");
				}
				$("#content").find("input[type='checkbox']").each(function() {
					var settings = getSettings();
					$(this).prop("checked", settings.isEnabled($(this).attr("id"), $(this).attr("default")));
				});
				$("#content").find("input[type='text'], input[type='color']").each(function() {
					$(this).val(getSettings().getValue($(this).attr("id"), $(this).attr("default")));
				});
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
					if (typeof saveAs != "undefined") {
						saveAs(blob, "puppets.csv");
					} else {
						$(document.body).append("<div name='save_file' file='puppets.csv' style='display:none;'>" + JSON.stringify(puppetArr) + "</div>");
					}
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
