(function(){
	var puppetHTML = '<form class="form-horizontal"> <fieldset> <div class="control-group"> <label class="control-label" for="puppet_name">Puppet Name:</label> <div class="controls"> <input id="puppet_name" maxlength="40" name="puppet_name" type="text" placeholder="Puppet Name" class="input-xlarge"> <button id="random_name" name="random_name" class="btn">Random Name</button> <button id="autofill_names" name="autofill_names" title="Automatically use names from an uploaded list" style="display:none;" class="btn">Autofill Names</button> </div> </div> <div class="control-group"> <label class="control-label" for="puppet_email">Email Address:</label> <div class="controls"> <input id="puppet_email" name="puppet_email" type="email" placeholder="Email (Optional)" class="input-xlarge"> </div> </div> <div class="control-group"> <label class="control-label" for="password">Password:</label> <div class="controls"> <input id="password" name="password" type="password" placeholder="Password" class="input-xlarge"> </div> </div> <div class="control-group"> <label class="control-label" for="type">Nation Type:</label> <div class="controls"> <select id="type" name="type" style="width: 284px;" class="input-xlarge"> <option value="random">Random Classification</option> <option value="100">Republic</option> <option value="101">Kingdom</option> <option value="102">Empire</option> <option value="103">Commonwealth</option> <option value="104">Federation</option> <option value="105">Colony</option> <option value="106">Principality</option> <option value="107">Protectorate</option> <option value="108">United States</option> <option value="109">United Kingdom</option> <option value="110">People"s Republic</option> <option value="111">Democratic Republic</option> <option value="112">Confederacy</option> <option value="113">Dominion</option> <option value="114">Sultanate</option> <option value="115">Holy Empire</option> <option value="116">Theocracy</option> <option value="117">Most Serene Republic</option> <option value="118">United Socialist States</option> <option value="119">Democratic States</option> <option value="120">Allied States</option> <option value="121">Queendom</option> <option value="122">Fiefdom</option> <option value="123">Constitutional Monarchy</option> <option value="124">Dictatorship</option> <option value="125">Matriarchy</option> <option value="126">Emirate</option> <option value="127">Grand Duchy</option> <option value="128">Free Land</option> <option value="129">Community</option> <option value="130">Disputed Territories</option> <option value="131">Jingoistic States</option> <option value="132">Armed Republic</option> <option value="133">Nomadic Peoples</option> <option value="134">Oppressed Peoples</option> <option value="135">Borderlands</option> <option value="136">Rogue Nation</option> <option value="137">Incorporated States</option> <option value="138">Federal Republic</option> </select> </div> </div> <div class="control-group"> <label class="control-label" for="history">Nation History:</label> <div class="controls"> <select id="history" name="history" style="width: 284px;" class="input-xlarge"> <option value="random">Random History</option> <option value="pioneer">Plucky, Malnourished Pioneers</option> <option value="tribe">Recently Discovered Undiscovered Tribe</option> <option value="sacker">Sackers and Salvagers</option> <option value="isolationist">Like-Minded Isolationists</option> <option value="segregationalist">Violent Segregationists</option> <option value="refugee">Ethnic Cleansing Refugees</option> <option value="wrangler">Diplomatic Homeland Wranglers</option> <option value="survivor">Civil Bloodbath Survivors</option> <option value="pilgrim">Long-Suffering But Still Optimistic Pilgrims</option> </select> </div> </div> <div class="control-group"> <label class="control-label" for="government_style">Government:</label> <div class="controls"> <select id="government_style" name="government_style" style="width: 284px;" class="input-xlarge"> <option value="random">Random</option> <option value="50.50.50">Sensible</option> <option value="25.75.50">Liberal</option> <option value="75.25.30">Conservative</option> <option value="75.75.25">Compassionate</option> <option value="75.75.75">Oppressive</option> <option value="80.80.90">Corrupt</option> <option value="20.20.20">Libertarian</option> <option value="0.0.0">Anarchic</option> <option value="100.100.100">Evil</option> </select> </div> </div> <div class="control-group"> <label class="control-label" for="currency">Currency:</label> <div class="controls"> <input id="currency" maxlength="40" name="currency" type="text" placeholder="Currency" value="" class="input-xlarge"> <button id="random_currency" name="random_currency" class="btn">Random Currency</button> </div> </div> <div class="control-group"> <label class="control-label" for="animal">Animal:</label> <div class="controls"> <input id="animal" maxlength="40" name="animal" type="text" placeholder="National Animal" value="" class="input-xlarge"> <button id="random_animal" name="random_animal" class="btn">Random Animal</button> </div> </div> <div class="control-group"> <label class="control-label" for="motto">Motto:</label> <div class="controls"> <input id="motto" name="motto" maxlength="55" type="text" placeholder="National Motto" value="" class="input-xlarge"> <button id="random_motto" name="random_motto" class="btn">Random Motto</button> </div> </div> <div class="control-group"> <label class="control-label" for="flag">Flag:</label> <div class="controls"> <div class="fileupload fileupload-new" data-provides="fileupload"><input type="hidden"><input type="hidden"> <div class="input-append"> <div class="uneditable-input span3" style="width: 270px;"><i class="icon-file fileupload-exists"></i> <span class="fileupload-preview">(Optional)</span></div><span class="btn btn-file"><span class="fileupload-new">Select file</span><span class="fileupload-exists">Change</span><input name="import_buttons" id="import_buttons" type="file"></span><a href="#" class="btn fileupload-exists" data-dismiss="fileupload">Remove</a> <button id="import_puppets_btn" class="btn btn-default" style="margin-top: -1px; margin-left: 20px;">Upload Flag</button> </div> </div> </div> </div> <div class="control-group"> <label class="control-label" for="destination">Destination:</label> <div class="controls"> <input id="destination" name="destination" type="text" placeholder="Region Name" class="input-xlarge"> <button id="random_region" maxlength="40" name="random_region" class="btn">Random Region</button> </div> </div> <div class="control-group"> <label class="control-label" for="add_to_puppets_list">Puppet List:</label> <div class="controls"> <input type="checkbox" id="add_to_puppets_list" name="add_to_puppets_list" class="btn btn-primary" checked></input> <label class="control-label" for="add_to_puppets_list" style="float: none;display: inline; position: relative;top: 4px;">Add Nation to Puppets</label> </div> </div> <div class="control-group"> <label class="control-label" for="apply_to_wa">Apply to WA:</label> <div class="controls"> <input type="checkbox" id="apply_to_wa" name="apply_to_wa" class="btn btn-primary" disabled title="Coming Soon."></input> <label class="control-label" for="apply_to_wa" style="float: none;display: inline; position: relative;top: 4px;" title="Coming Soon.">Apply for World Assembly Membership Email</label> </div> </div> <span class="danger_alert" id="error_label"></span> <div class="control-group"> <label class="control-label" for="found_nation">Found Nation</label> <div class="controls"> <button id="found_nation" name="found_nation" class="btn btn-primary">Found Nation</button> <button id="random_nation" name="random_nation" class="btn">Random Nation</button> </div> </div> <div class="control-group"> <label class="control-label" for="move_to_destination">Relocate:</label> <div class="controls"> <button id="move_to_destination" name="move_to_destination" class="btn btn-primary">Move to Destination</button> </div> </div> </fieldset> </form>';
	var CURRENCY_LIST = ["Dollar", "Credit", "Peso", "Euro", "Money", "Denero", "Shiny Green Things", "Yen", "Gold", "Platinum", "Latinum"];
	var ANIMAL_LIST = ["Eagle", "Dog", "Cat", "Lion", "Tiger", "Giraffe", "Zebra", "Vulture", "Python", "Rattlesnake", "Wolf", "Scorpion", "Spider", "Black Widow", "Black Bear", "Cow"];
	var MOTTO_LIST = ["The End of All Things", "Forward unto the dawn", "Flee, Flee for your lives", "Mostly Harmless", "The meaning to life, the universe, and everything", "42", 
						"This Motto Space For Sale", "This Space Intentionally Left Blank", "Puppeteer", "Turning and turning in the widening gyre", "The falcon cannot hear the falconer",
						"Things fall apart", "the centre cannot hold", "Mere anarchy is loosed upon the world", "The blood-dimmed tide is loosed, and everywhere", "The ceremony of innocence is drowned",
						"The best lack all conviction", "while the worst Are full of passionate intensity", "Surely some revelation is at hand" ];
	if (getVisiblePage() == "blank" && window.location.href.contains("?puppet_creator")) {
		window.document.title = "Puppet Creator";
		$("#content").html("<h1>Puppet Creation Center</h1>");
		$("#content").append("<div id='settings'></div>");
		$("#settings").html(puppetHTML);
		$("#import_puppets_btn").hide();
		$("#error_label").hide();
		$("#settings").find("input").removeAttr("required");
		$("#apply_to_wa").removeAttr("title").removeAttr("disabled");
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
		(new UserSettings()).child("last_puppet_email").set("");
		var lastEmail = localStorage.getItem("last_puppet_email");
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
				$.get("https://nationstatesplusplus.net/api/region/nations/?region=" + $("#destination").val().replaceAll(" ", "_").toLowerCase(), function(population) {
					if (population.length == 0) {
						$("#error_label").html("Creating New Region...").show();
						$.get("//www.nationstates.net/page=create_region?nspp=1", function(data) {
							if ($(data).find(".STANDOUT:first").attr("href").substring(7) != $("#puppet_name").val().replaceAll(" ", "_").toLowerCase()) {
								$("#error_label").removeClass("progress_alert").addClass("danger_alert").html("Not logged in as '" + $("#puppet_name").val() + "'. Log in or found '" + $("#puppet_name").val() + "' and try again.").show();
							} else {
								$.post("//www.nationstates.net/page=create_region?nspp=1", "page=create_region&region_name=" + encodeURIComponent($("#destination").val()) + "&desc=+&founder_control=1&delegate_control=0&create_region=+Create+Region+", function(data) {
									if ($(data).find("p.info").length > 0) {
										$("#error_label").removeClass("progress_alert").addClass("success_alert").html($(data).find("p.info").html());
									} else {
										$("#error_label").removeClass("progress_alert").addClass("danger_alert").html($(data).find("p.error").html());
									}
								});
							}
						});
					} else {
						$("#error_label").html("Moving To Existing Region...").show();
						$.get("//www.nationstates.net/region=" + $("#destination").val().replaceAll(" ", "_").toLowerCase() + "?nspp=1", function(data) {
							if ($(data).find(".STANDOUT:first").attr("href").substring(7) != $("#puppet_name").val().replaceAll(" ", "_").toLowerCase()) {
								$("#error_label").removeClass("progress_alert").addClass("danger_alert").html("Not logged in as '" + $("#puppet_name").val() + "'. Log in or found '" + $("#puppet_name").val() + "' and try again.").show();
							} else if ($(data).find("img[alt='Password required']").length > 0) {
								$("#error_label").removeClass("progress_alert").addClass("danger_alert").html("Can not move into passworded regions. Move the nation manually.").show();
							} else {
								$.post("//www.nationstates.net/page=change_region?nspp=1", "localid=" + $(data).find("input[name='localid']").val() + "&region_name=" + $(data).find("input[name='region_name']").val() + "&move_region=1", function(data) {
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
				localStorage.setItem("last_puppet_email", $("#puppet_email").val());
				$("#found_nation").attr("disabled", true);
				$.get("https://nationstatesplusplus.net/api/recruitment/puppet/?nation=" + $("#puppet_name").val().toLowerCase(), function() {
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
					$.post("//www.nationstates.net/cgi-bin/build_nation.cgi?nspp=1", questions + "&name=" + encodeURIComponent($("#puppet_name").val()) +
							"&type=" + type + "&flag=Default.png&history=" + history +
							"&style=" + $("#style").val() + "&currency=" + encodeURIComponent($("#currency").val()) +
							"&animal=" + encodeURIComponent($("#animal").val()) + "&slogan=" +
							encodeURIComponent($("#motto").val()) + 
							($("#puppet_email").val().length > 0 ? "&email=" + encodeURIComponent($("#puppet_email").val()) : "") + 
							"&password=" + encodeURIComponent($("#password").val()) + "&confirm_password=" + 
							encodeURIComponent($("#password").val()) + "&rname=&regionpw=&autologin=0&create_nation=Continue&legal=1", function(data) {
						if ($(data).find("p.error").length > 0) {
							$("#error_label").html($(data).find("p.error").html()).show();
						} else {
							//Set puppet to auto-dismiss issues
							localStorage.setItem($("#puppet_name").val().toLowerCase().replaceAll(" ", "_") + "-data", '{"userData":{"dismiss_all":true},"last_update":' + Date.now() + '}');
							if ($("#add_to_puppets_list").prop("checked")) {
								getPuppetManager().addPuppet($("#puppet_name").val(), $("#password").val());
							}
							//Disable recruitment/wa telegrams
							var disableRecruitment = function(callback) {
								$("#error_label").html("10% - Blocking Recruitment Telegrams...").show();
								$.get("//www.nationstates.net/page=tgsettings?nspp=1", function(data) {
									$("#error_label").html("20% - Blocking Recruitment Telegrams...").show();
									$.post("//www.nationstates.net/page=tgsettings?nspp=1", "chk=" + $(data).find('input[name="chk"]').val() + "&C1=3&C2=3&C3=3&C4=3&update_filter=1", function(data) {
										if (typeof callback != "undefined") callback();
									});
								});
							};
							
							//Delete existing telegrams
							var deleteTelegrams = function(callback) {
								$("#error_label").html("30% - Cleaning Up Telegram Inbox...").show();
								$.get("//www.nationstates.net/page=telegrams?nspp=1", function(data) {
									$("#error_label").html("40% - Cleaning Up Telegram Inbox...").show();
									$(data).find(".tgsentline").each(function() {
										var tgid = $(this).attr("href").split("=")[$(this).attr("href").split("=").length - 1]
										var chk = $(data).find('input[name="chk"]').val();
										$.get("//www.nationstates.net/page=ajax3/a=tgdelete/tgid=" + tgid + "/chk=" + chk + "?nspp=1", callback);
									});
								});
							};

							//Dismiss all issues
							var dismissIssues = function(callback) {
								$("#error_label").html("50% - Dismissing Issues...").show();
								$.post("//www.nationstates.net/page=dilemmas?nspp=1", "dismiss_all=1", callback);
							};

							var applyToWorldAssembly = function(callback) {
								if ($("#apply_to_wa").prop("checked")) {
									$("#error_label").html("60% - Apply for World Assembly Membership...").show();
									$.get("//www.nationstates.net/page=un?nspp=1", function(data) {
										$("#error_label").html("70% - Apply for World Assembly Membership...").show();
										var chk = $(data).find('input[name="chk"]').val();
										$.post("//www.nationstates.net/page=UN_status?nspp=1", "action=join_UN&chk=" + chk + "&submit=+Apply+to+Join+", callback);
									});
								} else {
									callback();
								}
							}

							var finalizePuppet = function() {
								if ($(".fileupload-preview").html().length > 0 && $(".fileupload-preview").html() != "(Optional)") {
									$("#error_label").html("80% - Uploading Puppet Flag...").show();
									$.get("//www.nationstates.net/page=upload_flag?nspp=1", function(data) {
										var file = $("input[type='file']")[0].files[0];
										var flagForm = new FormData();
										flagForm.append("nationname", $("#puppet_name").val().toLowerCase());
										flagForm.append("localid", $(data).find("input[name='localid']").val());
										flagForm.append("file", file);
										var flagUpload = new XMLHttpRequest();
										flagUpload.open("POST", "//www.nationstates.net/cgi-bin/upload.cgi?nspp=1");
										$("#error_label").html("90% - Uploading Puppet Flag...").show();
										flagUpload.onload = function(event) {
											$("#error_label").html("100% - Puppet Created Successfully!").removeClass("danger_alert").removeClass("progress_alert").addClass("success_alert").show();
											$("#found_nation").removeAttr("disabled");
										};
										flagUpload.send(flagForm);
									});
								} else {
									$("#error_label").html("100% - Puppet Created Successfully!").removeClass("danger_alert").removeClass("progress_alert").addClass("success_alert").show();
									$("#found_nation").removeAttr("disabled");
								}
							};
							disableRecruitment(function() {
								deleteTelegrams(function() {
									dismissIssues(function() {
										applyToWorldAssembly(function() {
											finalizePuppet();
										});
									})
								})
							});
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

