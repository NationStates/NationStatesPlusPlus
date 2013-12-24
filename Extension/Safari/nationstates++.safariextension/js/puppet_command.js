(function(){
	var CURRENCY_LIST = ["Dollar", "Credit", "Peso", "Euro", "Money", "Denero", "Shiny Green Things", "Yen", "Gold", "Platinum", "Latinum"];
	var ANIMAL_LIST = ["Eagle", "Dog", "Cat", "Lion", "Tiger", "Giraffe", "Zebra", "Vulture", "Python", "Rattlesnake", "Wolf", "Scorpion", "Spider", "Black Widow", "Black Bear", "Cow"];
	var MOTTO_LIST = ["The End of All Things", "Forward unto the dawn", "Flee, Flee for your lives", "Mostly Harmless", "The meaning to life, the universe, and everything", "42", 
						"This Motto Space For Sale", "This Space Intentionally Left Blank", "Puppeteer", "Not Even Remotely Random"];
	if (getVisiblePage() == "blank" && window.location.href.contains("?puppet_creator")) {
		window.document.title = "Puppet Creator";
		$("#content").html("<h1>Puppet Creation Center</h1>");
		$("#content").append("<div id='settings'></div>");
		$.get("http://nationstatesplusplus.net/nationstates/v2_2/puppet_creation.html", function(html) {
			$("#settings").html(html);
			$("#import_puppets_btn").hide();
			$("#error_label").hide();
			$("#settings").find("input").removeAttr("required");
			$("#random_name").on("click", function(event) {
				event.preventDefault();
				$("#puppet_name").val(getRandomName(Math.floor(Math.random() * 12) + 6).toTitleCase());
			});
			
			$("#random_currency").on("click", function(event) {
				event.preventDefault();
				$("#currency").val(CURRENCY_LIST[Math.floor(Math.random() * CURRENCY_LIST.length)]);
			});
			$("#random_animal").on("click", function(event) {
				event.preventDefault();
				$("#animal").val(ANIMAL_LIST[Math.floor(Math.random() * ANIMAL_LIST.length)]);
			});
			$("#random_motto").on("click", function(event) {
				event.preventDefault();
				$("#motto").val(MOTTO_LIST[Math.floor(Math.random() * MOTTO_LIST.length)]);
			});
			$("#random_region").on("click", function(event) {
				event.preventDefault();
				$("#destination").val(((Math.random() > 0.80 ? getRandomName(Math.floor(Math.random() * 6) + 6) + " " : "") + getRandomName(Math.floor(Math.random() * 16) + 6)).toTitleCase());
			});
			$("#random_nation").on("click", function(event) {
				event.preventDefault();
				$("#random_name").click();
				$("#random_currency").click();
				$("#random_animal").click();
				$("#random_motto").click();
			});
			//Remember last email
			var settings = getSettings();
			var lastEmail = settings.getValue("last_puppet_email");
			if (lastEmail != null) {
				$("#puppet_email").val(lastEmail);
			}
			
			$("#move_to_destination").on("click", function(event) {
				event.preventDefault();
				$("#error_label").removeClass("success_alert").addClass("danger_alert").hide();
				if ($("#destination").val().length == 0) $("#error_label").html("Missing Destination Region!").show();
				else if ($("#destination").val().length > 40) $("#error_label").html("Region Name Can Not Exceed 40 Characters!").show();
				else {
					$("#error_label").removeClass("danger_alert").addClass("progress_alert").html("Checking Region...").show();
					$.get("http://nationstatesplusplus.net/api/region/nations/?region=" + $("#destination").val().replaceAll(" ", "_").toLowerCase(), function(population) {
						if (population.length == 0) {
							$("#error_label").html("Creating New Region...").show();
							$.get("http://www.nationstates.net/page=create_region", function(data) {
								$.post("http://www.nationstates.net/page=create_region", "page=create_region&region_name=" + encodeURIComponent($("#destination").val()) + "&desc=+&founder_control=1&delegate_control=0&create_region=+Create+Region+", function(data) {
									if ($(data).find("p.info").length > 0) {
										$("#error_label").removeClass("progress_alert").addClass("success_alert").html($(data).find("p.info").html());
									} else {
										$("#error_label").removeClass("progress_alert").addClass("danger_alert").html($(data).find("p.error").html());
									}
								});
							});
						} else {
							$("#error_label").html("Moving To Existing Region...").show();
							$.get("http://www.nationstates.net/region=" + $("#destination").val().replaceAll(" ", "_").toLowerCase(), function(data) {
								if ($(data).find(".STANDOUT:first").attr("href").substring(7) != $("#puppet_name").val().replaceAll(" ", "_").toLowerCase()) {
									$("#error_label").removeClass("progress_alert").addClass("danger_alert").html("Not logged in as '" + $("#puppet_name").val() + "'. Log in or found '" + $("#puppet_name").val() + "' and try again.").show();
								} else if ($(data).find("img[alt='Password required']").length > 0) {
									$("#error_label").removeClass("progress_alert").addClass("danger_alert").html("Can not move into passworded regions. Move the nation manually.").show();
								} else {
									$.post("http://www.nationstates.net/page=change_region", "localid=" + $(data).find("input[name='localid']").val() + "&region_name=" + $(data).find("input[name='region_name']").val() + "&move_region=1", function(data) {
										$("#error_label").removeClass("progress_alert").addClass("success_alert").html("Moved Into " + $("#destination").val() + " Successfully!").show();
									});
								}
							});
						}
					});
				}
			});
			
			$("#found_nation").on("click", function(event) {
				event.preventDefault();
				$("#error_label").removeClass("success_alert").removeClass("progress_alert").addClass("danger_alert").hide();
				if ($("#puppet_name").val().length == 0) $("#error_label").html("Missing Puppet Name!").show();
				else if ($("#puppet_name").val().length > 40) $("#error_label").html("Puppet Name Can Not Exceed 40 Characters!").show();
				else if ($("#password").val().length == 0) $("#error_label").html("Missing Password!").show();
				else if ($("#currency").val().length == 0) $("#error_label").html("Missing Currency Name!").show();
				else if ($("#currency").val().length > 40) $("#error_label").html("Currency Name Can Not Exceed 40 Characters!").show();
				else if ($("#animal").val().length == 0) $("#error_label").html("Missing Animal Name!").show();
				else if ($("#animal").val().length > 40) $("#error_label").html("Animal Name Can Not Exceed 40 Characters!").show();
				else if ($("#motto").val().length == 0) $("#error_label").html("Missing National Motto!").show();
				else if ($("#motto").val().length > 55) $("#error_label").html("National Motto Can Not Exceed 55 Characters!").show();
				else if ($("#motto").val().length == 0) $("#error_label").html("Missing National Motto!").show();
				else if ($("#motto").val().length > 55) $("#error_label").html("National Motto Can Not Exceed 55 Characters!").show();
				else if ($("input[type='file']")[0].files.length > 0 && $("input[type='file']")[0].files[0].size > 250000)  $("#error_label").html("Flags can not be larger than 250kb").show();
				else if ($("input[type='file']")[0].files.length > 0 && $("input[type='file']")[0].files[0].name.match(/.(jpg|png|gif)/) == null)  $("#error_label").html("Only PNG, JPG and GIF flags are supported").show();
				else {
					var settings = getSettings();
					settings.setValue("last_puppet_email", $("#puppet_email").val());
					settings.save();
					$("#found_nation").attr("disabled", true);
					$.get("http://nationstatesplusplus.net/api/recruitment/puppet/?nation=" + $("#puppet_name").val().toLowerCase(), function() {
						var questions = "";
						var ANSWERS = ["SD", "D", "A", "SA"]
						for (var i = 0; i <= 7; i += 1) {
							if (questions.length > 0) questions += "&";
							questions += "Q" + i + "=";
							questions += ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
						}
						$("#error_label").html("Attempting Puppet Creation...").removeClass("success_alert").removeClass("danger_alert").addClass("progress_alert").show();
						var type = ($("#type").val() == "random" ? Math.floor(Math.random() * 38) + 100 : $("#type").val());
						var history = ($("#history").val() == "random" ? Math.floor(($("#history").find("option").length - 1) * Math.random()) : $("#history").val());
						$.post("http://www.nationstates.net/cgi-bin/build_nation.cgi", questions + "&name=" + encodeURIComponent($("#puppet_name").val()) +
								"&type=" + type + "&flag=Default.png&history=" + history +
								"&style=" + $("#style").val() + "&currency=" + encodeURIComponent($("#currency").val()) +
								"&animal=" + encodeURIComponent($("#animal").val()) + "&slogan=" +
								encodeURIComponent($("#motto").val()) + 
								($("#puppet_email").val().length > 0 ? "&email=" + encodeURIComponent($("#puppet_email").val()) : "") + 
								"&password=" + encodeURIComponent($("#password").val()) + "&confirm_password=" + 
								encodeURIComponent($("#password").val()) + "&autologin=0&create_nation=Continue&legal=1", function(data) {
							if ($(data).find("p.error").length > 0) {
								$("#error_label").html($(data).find("p.error").html()).show();
							} else {
								//Set puppet to auto-dismiss issues
								localStorage.setItem($("#puppet_name").val().toLowerCase().replaceAll(" ", "_") + "-data", '{"userData":{"dismiss_all":true},"last_update":' + Date.now() + '}');
								if ($("#add_to_puppets_list").prop("checked")) {
									addPuppetNation($("#puppet_name").val(), $("#password").val());
								}
								//Disable recruitment/wa telegrams
								$.get("http://www.nationstates.net/page=tgsettings", function(data) {
									$.post("http://www.nationstates.net/page=tgsettings", "chk=" + $(data).find('input[name="chk"]').val() + "&C1=3&C2=3&C3=3&C4=0&update_filter=1", function(data) {
										console.log("Updated TG settings");
									});
								});
								//Delete existing telegrams
								$.get("http://www.nationstates.net/page=telegrams", function(data) {
									$(data).find(".tgsentline").each(function() {
										var tgid = $(this).attr("href").split("=")[$(this).attr("href").split("=").length - 1]
										var chk = $(data).find('input[name="chk"]').val();
										$.get("http://www.nationstates.net/page=ajax3/a=tgdelete/tgid=" + tgid + "/chk=" + chk, function() { });
									});
								});
								//Dismiss all issues
								$.post("http://www.nationstates.net/page=dilemmas", "dismiss_all=1", function() { });
								
								//Hide All Newspapers
								doAuthorizedPostRequestFor($("#puppet_name").val().toLowerCase().replaceAll(" ", "_"), "http://nationstatesplusplus.net/api/nation/settings/", "settings=" + encodeURIComponent('{"settings":{"show_gameplay_news":false,"show_roleplay_news":false,"show_regional_news":false,"show_irc":false,"show_world_census":false,"show_regional_population":false,},"last_update":' + Date.now() + '}'), function() {});
								
								if ($(".fileupload-preview").html().length > 0 && $(".fileupload-preview").html() != "(Optional)") {
									$.get("http://www.nationstates.net/page=upload_flag", function(data) {
										var file = $("input[type='file']")[0].files[0];
										var flagForm = new FormData();
										flagForm.append("nationname", $("#puppet_name").val().toLowerCase());
										flagForm.append("localid", $(data).find("input[name='localid']").val());
										flagForm.append("file", file);
										var flagUpload = new XMLHttpRequest();
										flagUpload.open("POST", "http://www.nationstates.net/cgi-bin/upload.cgi");
										$("#error_label").html("Uploading Puppet Flag...").show();
										flagUpload.onload = function(event) {
											$("#error_label").html("Puppet Created Successfully!").removeClass("danger_alert").removeClass("progress_alert").addClass("success_alert").show();
											$("#found_nation").removeAttr("disabled");
										};
										flagUpload.send(flagForm);
									});
								} else {
									$("#error_label").html("Puppet Created Successfully!").removeClass("danger_alert").removeClass("progress_alert").addClass("success_alert").show();
									$("#found_nation").removeAttr("disabled");
								}
							}
						}).fail(function() {
							$("#found_nation").removeAttr("disabled");
							$("#error_label").html("Unknown Error Creating Puppet...").show();
						});
					}).fail(function() {
						$("#found_nation").removeAttr("disabled");
						$("#error_label").html("Nation Already Exists. Nation Names Must Be Unique!").show();
					});
				}
			});
		});
	}

	function getRandomVowel() {
		var r = Math.floor((Math.random() * 38100));
		if (r < 8167) return 'a';
		if (r < 20869) return 'e';
		if (r < 27835) return 'i';
		if (r < 35342) return 'o';
		return 'u';
	}

	function getRandomConsonant() {
		var r = Math.floor((Math.random() * 34550));
		r += Math.floor((Math.random() * 34550));
		
		if (r < 1492) return 'b';
		if (r < 4274) return 'c';
		if (r < 8527) return 'd';
		if (r < 10755) return 'f';
		if (r < 12770) return 'g';
		if (r < 18864) return 'h';
		if (r < 19017) return 'j';
		if (r < 19789) return 'k';
		if (r < 23814) return 'l';
		if (r < 26220) return 'm';
		if (r < 32969) return 'n';
		if (r < 34898) return 'p';
		if (r < 34993) return 'q';
		if (r < 40980) return 'r';
		if (r < 47307) return 's';
		if (r < 56363) return 't';
		if (r < 57341) return 'v';
		if (r < 59701) return 'w';
		if (r < 59851) return 'x';
		if (r < 61825) return 'y';
		return 'z';
	}

	function generateRandomWord(maxLength) {
		var str = "";
		var nextLetter;
		var length = Math.max(7, maxLength);
		for (var i = 0; i < length; i += 1) {
			var r = Math.floor((Math.random() * 1000));
			if (r < 381) {
				nextLetter = getRandomVowel();
			} else {
				nextLetter = getRandomConsonant();
			}
			if (i == 0) {
				nextLetter = nextLetter.toUpperCase();
			}
			str += nextLetter;
		}
		return str;
	}

	function isValidName(name) {
		var vowelStreak = 0;
		var consonantStreak = 0;

		name = name.toLowerCase();
		for (var i = 0; i < name.length; i += 1) {
			var ch = name[i];
			if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') {
				vowelStreak += 1;
				consonantStreak = 0;
			} else {
				consonantStreak += 1;
				vowelStreak = 0;
			}
			if (consonantStreak > 2 || vowelStreak > 2) {
				return false;
			}
		}
		return true;
	}

	function getRandomName(maxLength) {
		while(true) {
			var name = generateRandomWord(maxLength);
			if (isValidName(name)) {
				return name;
			}
		}
	}
})();

