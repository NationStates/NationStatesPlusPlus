(function(){
	var recruitmentHTML = '<h1>NationStates++ Recruitment</h1><form class="form-horizontal"><div class="control-group"><h2>Existing Recruitment Campaigns</h2><ul id="campaigns"><li>Loading Campaigns...</li></ul></div><hr><div class="control-group"><h2>Retired Recruitment Campaigns</h2><ul id="retired-campaigns"><li>Loading Campaigns...</li></ul></div><hr><div class="control-group"><h2>Recruitment Effectiveness</h2></div><hr><div class="control-group"><h2>Recruitment Officers</h2><div style="margin:8px">Recruitment Officers can contribute to your regions recruitment, view and edit recruitment campaigns.</div><div style="margin:8px">Only the regional founder and regional delegate can appoint or remove recruitment officers.</div><label class="control-label" for="recruitment_officers">Recruitment Officers</label><select id="recruitment_officers" name="recruitment_officers" class="input-xlarge" style="width:460px;height:200px;margin-left:24px" multiple="multiple"><option>Option one<option>Option two</select></div><div class="control-group"><div class="controls"><button id="remove_selected_officers" name="remove_selected_officers" class="btn btn-danger">Remove Selected Officers</button></div></div><div class="control-group"><label class="control-label" for="add_officer">Add Officer</label><div class="controls"><div class="input-append"><input id="add_officer" name="add_officer" class="input-xlarge" placeholder="Really Cool Nation" style="width:450px" type="text"><div class="btn-group"><button id="add_officer_btn" class="btn" style="height:32px">Add Officer</button></div></div><span id="officer_error" style="display:none;color:red">Not a valid nation</span> <span id="officer_duplicate" style="display:none;color:red">Nation is already an editor!</span></div></div><hr><div class="control-group"><label class="control-label" for="rtype">Recruitment Type</label><div class="controls"><select id="rtype" name="rtype" style="width:465px" class="input-xlarge"><option value="0">New Nations<option value="1">Refounded Nations<option value="2">Ejected Nations<option value="3">Active Gamerites<option value="4">Active Userites<option value="5">Active Nations<option value="6">Capitalist Nations<option value="7">Socialist Nations<option value="8">Centrist Nations<option value="9">Authoritarian Nations<option value="10">Libertarian Nations<option value="11">Lonely Nations</select></div><div style="margin-left:184px;margin-bottom:-20px"><p id="rdesc_0" name="rdesc" style="display:none">New Nations: Nations founded recently.</p><p id="rdesc_1" name="rdesc" style="display:none">Refounded Nations: Nations that ceased to exist and were refounded.</p><p id="rdesc_2" name="rdesc" style="display:none">Ejected Nations: Nations that have been forcibly relocated to the Rejected Realms.</p><p id="rdesc_3" name="rdesc" style="display:none">Active Gamerites: Nations residing in Game-Created Regions that are active in NationStates.</p><p id="rdesc_4" name="rdesc" style="display:none">Active Userites: Nations residing in User-Created Regions that are active in NationStates.</p><p id="rdesc_5" name="rdesc" style="display:none">Active Nations: Nations that are active in NationStates.</p><p id="rdesc_6" name="rdesc" style="display:none">Capitalist Nations: Active, new, or refounded nations with right-wing, capitalist views.</p><p id="rdesc_7" name="rdesc" style="display:none">Socialist Nations: Active, new, or refounded nations with left-wing, socialist views.</p><p id="rdesc_8" name="rdesc" style="display:none">Centrist Nations: Active, new, or refounded nations with centrist, inoffensive views.</p><p id="rdesc_9" name="rdesc" style="display:none">Authoritarian Nations: Active, new, or refounded nations that favour authoritarianism, dictators, or fascists.</p><p id="rdesc_10" name="rdesc" style="display:none">Libertarian Nations: Active, new, or refounded nations that favour libertarianism, tiny governments and an emphasis on civil and political rights.</p><p id="rdesc_11" name="rdesc" tyle="display:none;">Lonely Nations: Nations residing in tiny regions, with very few members.</p></div></div><div class="control-group"><label class="control-label" for="clientkey">Client Key</label><div class="controls"><input id="clientkey" name="clientkey" type="text" placeholder="Client Key" style="width:450px" class="input-xlarge"> <span title="A Client Key can be requested from a Getting Help Request. Once it has been requested, it may take up to 24 hours for the request to be filled, so be patient." style="font-size:10px"><a href="/page=help?recruitment">(What is this?)</a></span></div></div><div class="control-group"><label class="control-label" for="tgid">Telegram ID</label><div class="controls"><input id="tgid" name="tgid" type="text" placeholder="Telegram ID" style="width:450px" class="input-xlarge"> <span title="Send your recruitment telegram to &quot;tag:api&quot; to receive a tgid and secret key" style="font-size:10px"><a href="//www.nationstates.net/pages/api.html#telegrams">(What is this?)</a></span></div></div><div class="control-group"><label class="control-label" for="secretkey">Secret Key</label><div class="controls"><input id="secretkey" name="secretkey" type="text" placeholder="Secret Key" style="width:450px" class="input-xlarge"> <span title="Send your recruitment telegram to &quot;tag:api&quot; to receive a tgid and secret key" style="font-size:10px"><a href="//www.nationstates.net/pages/api.html#telegrams">(What is this?)</a></span></div></div><div class="control-group"><label class="control-label" for="allocation">Percent Allocated</label><div class="controls"><input id="allocation" name="allocation" type="range" min="1" value="100" max="100" style="width:414px;margin-right:10px" placeholder="" class="input-xlarge"> <span style="font-size:10px"><input style="min-width:26px;width:26px" class="text-input" name="percent_input" type="text" max="100" min="1" size="2" value="100"> (Percent of requests allocated)</span></div></div><div class="control-group"><label class="control-label" for="gcrs">GCR\'s Only</label><div class="controls"><label class="checkbox inline" for="gcrs"><input type="checkbox" name="gcrs" id="gcrs" value="(Arnhelm Signatories)"> (Arnhelm Signatories)</label></div></div><div class="control-group"><label class="control-label" for="filter">Filter Names</label><div class="controls"><input id="filter" name="filter" type="text" placeholder="Filter Names (Optional)" style="width:450px" class="input-xlarge"><p class="help-block">Comma separated list</p></div></div><div style="margin-left:184px"><p id="missing-client-key" name="error" style="display:none;color:red">Missing Client Key.</p><p id="invalid-client-key" name="error" style="display:none;color:red">Invalid Client Key. Client keys are 8 characters long, without spaces. Obtain one for your region with a <a href="/page=help?recruitment">Getting Help Request.</a></p><p id="missing-tgid" name="error" style="display:none;color:red">Missing Telegram ID.</p><p id="invalid-tgid" name="error" style="display:none;color:red">Invalid Telegram ID, Telegram ID\'s are numeric.</p><p id="missing-secret-key" name="error" style="display:none;color:red">Missing Secret Key.</p><p id="invalid-secret-key" name="error" style="display:none;color:red">Invalid Secret Key. Secret keys are 12 characters long, without spaces.</p><p id="unknown-error" name="error" style="display:none;color:red"></p></div><div class="control-group"><label class="control-label" for="submit"></label><div class="controls"><button id="submit" name="submit" class="btn btn-success">Create Recruitment Campaign</button></div></div></form>'
	var recruitmentTypes = ["New Nations", "Refounded Nations", "Ejected Nations", "Active Gamerites", "Active Userites", "Active Nations", "Capitalist Nations", "Socialist Nations", "Centrist Nations", "Authoritarian Nations", "Libertarian Nations", "Lonely Nations"];

	$(window).on("websocket/is_recruitment_officer", function(data) {
		if (data.json.result == "true") {
			checkRecruitment();
			$("#recruit-admin").show();
		} else if (getVisiblePage() == "blank" && typeof $.QueryString["recruitment"] != "undefined") {
			var region = $.QueryString["recruitment"].replaceAll("_", " ").toTitleCase();
			$("#campaigns").html("<li>You do not have permission to view active campaigns for " + region + "</li>"); 
			$("#retired-campaigns").html("<li>You do not have permission to view retired campaigns for " + region + "</li>"); 
		}
	});

	function checkRecruitment() {
		var event = jQuery.Event("websocket/request");
		event.json = { name: "recruitment_progress", data : {} };
		event.requiresAuth = true;
		$(window).trigger(event);
	}

	function quickSetup() {
		if (getVisiblePage() != "panel" && getVisiblePage() != "hpanel") {
			var progress = localStorage.getItem(getUserNation() + "-last-recruitment");
			if (progress != null && parseInt(progress) + 190000 > Date.now() && getSettings().isEnabled("show_recruitment_progress")) {
				setupRecruitment();
				updateRecruitmentStatus(true);
				for (var i = 1; i <= 50; i += 1)
					setTimeout(updateRecruitmentStatus, i * 200, false);
			}
		}
	}
	quickSetup();

	$(window).on("websocket/recruitment_progress", function(event) {
		localStorage.setItem(getUserNation() + "-last-recruitment", event.json.recruitment.timestamp);
		localStorage.setItem(getUserNation() + "-last-recruitment-data", JSON.stringify(event.json.recruitment));
		localStorage.removeItem(getUserNation() + "-last-recruitment-error");

		if (event.json.recruitment.wait) {
			setTimeout(checkRecruitment, parseInt(event.json.recruitment.wait) * 1000);
			for (var i = 1; i <= parseInt(event.json.recruitment.wait) * 5; i += 1) {
				setTimeout(updateRecruitmentStatus, 200 * i, false);
			}
		} else {
			recruitNation(event.json.recruitment);
		}
		
		//Check that we are on the gameside and not forums
		if (getVisiblePage() != "panel" && getVisiblePage() != "hpanel") {
			//Check that we have "show recruitment progress" setting enabled
			if ($("#rprogress").length == 0 && event.json.show_recruitment_progress) {
				setupRecruitment();
			}
		}
		
		updateRecruitmentStatus(true);
	});
	
	function setupRecruitment() {
		var rProgress = "<div id='rprogress'><span id='rprogress-text'><i class='fa fa-envelope-o' style='margin-right: 5px;'></i>Telegramming: <span id='tg-nation'></span></span><span id='r-sender'></span><div id='rprogress-bar'></div></div>";
		$("body").prepend(rProgress);
		$("#content").css("margin-top", "20px");
		if ($(".regional_power").length > 0) {
			$(".regional_power").css("top", ($(".regional_power").position().top + 20) + "px");
		}
		//Support old browsers that do not allow css calc
		if ($("#rprogress").width() < 10) {
			$(window).resize(function() {
				$("#rprogress").width($("#content").width() + 30);
			});
			$(window).trigger("resize");
		}
	}

	function updateRecruitmentStatus(updateData) {
		if (updateData) {
			var data = localStorage.getItem(getUserNation() + "-last-recruitment-data")
			var error = localStorage.getItem(getUserNation() + "-last-recruitment-error")
			
			//Update recruitment nation & recruiter
			if (error != null) {
				$("#tg-nation").html("Error, " + error);
			} else if (data != null) {
				data = JSON.parse(data);
				if (data.nation) {
					$("#tg-nation").html("<a style='color:white;' href='/nation=" + data.nation + "'>" + data.nation.replaceAll("_", " ").toTitleCase() + "</a>");
					if (data.recruiter && data.recruiter != getUserNation()) {
						$("#rprogress").css("opacity", "0.3");
						$("#r-sender").html("Sent by " + data.recruiter.replaceAll("_", " ").toTitleCase());
					}
				}
			}
		}
		if (updateData || isPageActive()) {
			var progress = localStorage.getItem(getUserNation() + "-last-recruitment");
			if (progress != null) {
				//Old recruitment data, delete it
				if (parseInt(progress) + 190000 < Date.now()) {
					localStorage.removeItem(getUserNation() + "-last-recruitment");
					localStorage.removeItem(getUserNation() + "-last-recruitment-data");
					localStorage.removeItem(getUserNation() + "-last-recruitment-error");
					progress = null;
					if ($("#rprogress").length > 0) {
						$("#rprogress-bar").width($("#rprogress").width());
					}
				} else if ($("#rprogress").length > 0) {
				//Update progress bar
					$("#rprogress-bar").width($("#rprogress").width() * ((Date.now() - parseInt(progress)) / 190000));
				}
			}
		}
	}

	function recruitNation(data) {
		$.get("//www.nationstates.net/cgi-bin/api.cgi?a=sendTG&client=" + data.client_key + "&tgid=" + data.tgid + "&key=" + data.secret_key + "&to=" + data.nation + "&nspp=1", function(result) {
			var event = jQuery.Event("websocket/request");
			event.json = { name: "confirm_recruitment", data : { target: data.nation} };
			event.requiresAuth = true;
			$(window).trigger(event);
			checkRecruitment();
		}).fail(function(result, textStatus, jqXHR) {
			console.log(result);
			console.log(textStatus);
			console.log(jqXHR);
			localStorage.setItem(getUserNation() + "-last-recruitment", Date.now());
			$("#tg-nation").html("Error, " + result.statusText);
			localStorage.setItem(getUserNation() + "-last-recruitment-error", result.statusText);
			checkRecruitment();
		});
	}

	if (getVisiblePage() == "blank" && typeof $.QueryString["recruitment"] != "undefined") {
		var region = $.QueryString["recruitment"].toLowerCase().replaceAll(" ", "_");
		window.document.title = "NS++ Recruitment";

		var feeders = ["the_north_pacific", "the_pacific", "the_east_pacific", "the_west_pacific", "the_south_pacific", "the_rejected_realms", "lazarus", "osiris", "balder"];
		for (var i = 0; i < feeders.length; i += 1) {
			if (feeders[i] == region) {
				$("#content").html("<h1>Recruitment<h1><p>Game-Created Regions are exempt from NS++ recruitment. Have a nice day.");
				return;
			}
		}
		$("#content").html(recruitmentHTML);
		var event = jQuery.Event("websocket/request");
		event.json = { name: "recruitment_campaigns", data : { } };
		event.requiresAuth = true;
		$(window).trigger(event);
		
			
		var effectiveness = $("h2:contains('Recruitment Effectiveness')");
		$("<div id='legend' style='margin-left: 10%;'></div>").insertAfter(effectiveness);
		$("<h3>Legend:</h3>").insertAfter(effectiveness);
		$("<div style='margin-bottom:4px;'><div style='display:inline; margin-left:10%'>Now</div><div style='display:inline; margin-left:74%'>30 Days Ago</div></div><div id='month_effectiveness' style='width: 80%; margin-left:10%; margin-right:10%; border: 2px solid black; height: 70px;'></div>").insertAfter(effectiveness);
		$("<h3 id='last_month'>Last Month</h3>").insertAfter(effectiveness);
		$("<div style='margin-bottom:4px;'><div style='display:inline; margin-left:10%'>Now</div><div style='display:inline; margin-left:74%'>7 Days Ago</div></div><div id='week_effectiveness' style='width: 80%; margin-left:10%; margin-right:10%; border: 2px solid black; height: 70px;'></div>").insertAfter(effectiveness);
		$("<h3 id='last_week'>Last Week</h3>").insertAfter(effectiveness);
		$("<div style='margin-bottom:4px;'><div style='display:inline; margin-left:10%'>Now</div><div style='display:inline; margin-left:74%'>24 Hours Ago</div></div><div id='day_effectiveness' style='width: 80%; margin-left:10%; margin-right:10%; border: 2px solid black; height: 70px;'></div>").insertAfter(effectiveness);
		$("<h3 id='last_day'>Last 24 Hours</h3>").insertAfter(effectiveness);
		
		var effectivenessJson = null;
		$(window).on("resize", function() {
			if (effectivenessJson != null) {
				var event = jQuery.Event("websocket/recruitment_effectiveness");
				event.json = effectivenessJson;
				$(window).trigger(event);
			}
		});
		$(window).on("websocket/recruitment_effectiveness", function(event) {
			effectivenessJson = event.json;
			var day = 24 * 60 * 60 * 1000;
			var week = 7 * day;
			var width = $("#month_effectiveness").width();
			var monthHTML = "";
			var weekHTML = "";
			var dayHTML = "";
			var colors = {};
			var colorIndex = 0;
			var colorChoices = ["DodgerBlue", "green", "red", "BlueViolet", "yellow", "orange", "cyan", "brown", "SeaGreen", "SlateGray", "Teal", "Tomato", "Violet", "pink"];
			var now = Date.now() - 4 * 60 * 1000;
			for (var i = 0; i < event.json.progress.length; i += 1) {
				var recruiter = event.json.progress[i];
				
				if (colors[recruiter.recruiter] == null) {
					if (colorIndex < colorChoices.length) {
						colors[recruiter.recruiter] = colorChoices[colorIndex];
						colorIndex += 1;
					} else {
						colors[recruiter.recruiter] = "black";
					}
				}
				var color = colors[recruiter.recruiter];
				
				monthHTML += generateEffectivenessHTML(now, width, recruiter, day * 30, color);
				if (recruiter.end > now - day) {
					dayHTML += generateEffectivenessHTML(now, width, recruiter, day, color);
				}
				if (recruiter.end > now - week) {
					weekHTML += generateEffectivenessHTML(now, width, recruiter, week, color);
				}
			}
			$("#month_effectiveness").html("<div style='position:relative; height:70px;'>" + monthHTML + "</div>");
			$("#week_effectiveness").html("<div style='position:relative; height:70px;'>" + weekHTML + "</div>");
			$("#day_effectiveness").html("<div style='position:relative; height:70px;'>" + dayHTML + "</div>");
			$("#last_month").html("Last Month <span style='margin-left:8px; font-size:12px; font-weight:normal;'>(" + ((event.json.total / (475 * 30)) * 100).toFixed(2) + "%)</span>");
			$("#last_week").html("Last Week <span style='margin-left:8px; font-size:12px; font-weight:normal;'>(" + ((event.json.week / (465 * 7)) * 100).toFixed(2) + "%)</span>");
			$("#last_day").html("Last 24 Hours <span style='margin-left:8px; font-size:12px; font-weight:normal;'>(" + ((event.json.day / 455) * 100).toFixed(2) + "%)</span>");
			var legend = "";
			for (var name in colors) {
				var color = colors[name];
				legend += "<p><div style='background: " + color + "; height: 14px; width: 14px; float:left; margin-right: 10px; margin-top: 2px;'></div>" + name + "</p>";
			}
			$("#legend").html(legend);
		});

		function generateEffectivenessHTML(now, width, recruiter, timeLen, color) {
			var length = recruiter.end - recruiter.start;
			var percentage = length / timeLen;
			var ourWidth = width * percentage;
			var left = ((now - recruiter.end) / timeLen) * width;
			ourWidth = Math.min(ourWidth, width - left);
			return "<div title='" + recruiter.recruiter + "' style='height: 70px; position:absolute; left: " + left + "px; background:" + color + "; width: " + ourWidth + "px;'></div>";
		}

		function generateCampaignHTML(campaign) {
			var html = ""
			if (campaign.retired == 0) {
				html += "<li name='campaign' data-cid='" + campaign.id + "'><h3 style='margin-bottom: 0px;'>" + (new Date(campaign.created)).customFormat("#DD#, #MMM#, #YYYY#") + " - Present";
			} else {
				html += "<li name='campaign' data-cid='" + campaign.id + "'><h3 style='margin-bottom: 0px;'>" + (new Date(campaign.created)).customFormat("#DD#, #MMM#, #YYYY#") + " - " + (new Date(campaign.retired)).customFormat("#DD#, #MMM#, #YYYY#");
			}
			html += "<span style='font-weight:normal; font-size:14px; margin-left:115px;'><a href='#campaign' data-cid='" + campaign.id + "'>View Campaign";
			html += "<span class='arrow-down'></span>";
			html += "</a></span></h3>";

			var existingVisible = $("div[data-cid='" + campaign.id + "']").is(":visible");
			
			html += "<div style='" + (existingVisible ? "display:block" : "display:none") + "' data-cid='" + campaign.id + "'>";
			html += "<table class='table table-hover' style='width: 500px'><tbody><tr><td>Recruitment Type:</td><td> " + recruitmentTypes[campaign.type] + "</td></tr>";
			html += "<tr><td>Allocation:</td><td> " + campaign.allocation + "%</td></tr>";
			html += "<tr><td>Client Key:</b></td><td> " + campaign.client_key + "</td></tr>";
			html += "<tr><td>Telegram ID:</b></td><td> " + campaign.tgid + "</td></tr>";
			html += "<tr><td>Secret Key:</b></td><td> " + campaign.secret_key + "</td></tr>";
			html += "<tr><td>Total Telegrams Sent:</b></td><td> " + campaign.total_sent + "</td></tr>";
			html += "<tr><td>Recruited Nations:</b></td><td>" + campaign.pending_recruits + "</td></tr>";
			html += "<tr><td>Pending Recruits:</b></td><td>" + campaign.recruits + "</td></tr>";
			html += "<tr><td>Recruited & Deceased:</b></td><td>" + campaign.dead_recruits + "</td></tr>";
			html += "</tbody></table>";
			if (campaign.retired == 0) {
				html += "<button name='retire' data-cid='" + campaign.id + "' class='btn btn-danger'>Retire Campaign</button>";
			} else {
				html += "<button name='delete_campaign' data-cid='" + campaign.id + "' class='btn btn-danger'>Delete Campaign History</button>";
			}
			html += "</div>";
			return html;
		}

		$(window).on("websocket/recruitment_campaigns", function(event) {
			var data = event.json;
			var html = "";
			for (var i = 0; i < data.length; i += 1) {
				if (data[i].retired == 0) {
					html += generateCampaignHTML(data[i]);
				}
			}
			if (html.length > 0) {
				$("#campaigns").html(html);
			}
			else {
				$("#campaigns").html("<li>No Active Campaigns.</li>");
			}
			html = "";
			for (var i = 0; i < data.length; i += 1) {
				if (data[i].retired != 0) {
					html += generateCampaignHTML(data[i]);
				}
			}
			if (html.length > 0) {
				$("#retired-campaigns").html(html);
			}
			else {
				$("#retired-campaigns").html("<li>No Retired Campaigns.</li>");
			}
		});

		$("body").on("click", "button[name='retire']", function(event) {
			event.preventDefault();
			if ($(this).html() != "Are you sure?") {
				$(this).html("Are you sure?");
			} else {
				var cid = $(this).data("cid");

				var event = jQuery.Event("websocket/request");
				event.json = { name: "retire_recruitment_campaign", data : { campaignId: cid} };
				event.requiresAuth = true;
				$(window).trigger(event);

				$("li[data-cid='" + cid + "']").animate({height: 'toggle'}, 1000);
			}
		});

		$("body").on("click", "button[name='delete_campaign']", function(event) {
			event.preventDefault();
			if ($(this).html() != "Are you sure?") {
				$(this).html("Are you sure?");
			} else {
				var cid = $(this).data("cid");

				var event = jQuery.Event("websocket/request");
				event.json = { name: "delete_recruitment_campaign", data : { campaignId: cid} };
				event.requiresAuth = true;
				$(window).trigger(event);
	
				$("li[data-cid='" + cid + "']").animate({height: 'toggle'}, 500);
			}
		});

		$("body").on("click", "a[href='#campaign']", function(event) {
			event.preventDefault();
			var div = $("div[data-cid='" + $(this).data("cid") + "']");
			if (div.is(":visible")) {
				div.parent().find(".arrow-up").removeClass("arrow-up").addClass("arrow-down");
			} else {
				div.parent().find(".arrow-down").removeClass("arrow-down").addClass("arrow-up");
			}
			div.animate({height: 'toggle'}, 500);
			
		});

		//Fetch officers list
		$(window).on("websocket/recruitment_officers", function(event) {
			var data = event.json;
			$("#recruitment_officers").html("");
			$("#add_officer").val("");

			var html = "";
			for (var i = 0; i < data.length; i += 1) {
				html += "<option value='" + data[i].name + "'>" + data[i].full_name + "</option>";
			}
			$("#recruitment_officers").html(html);
			if (data.length >= 5) {
				$("#add_officer_btn").attr("disabled", true);
				$("#add_officer_btn").attr("title", "Maximum officer limit reached.");
			} else {
				$("#add_officer_btn").removeAttr("disabled");
				$("#add_officer_btn").removeAttr("title");
			}
		});

		//Autocomplete officer names
		if (navigator.userAgent.toLowerCase().indexOf('firefox') == -1) {
			$("#add_officer").autocomplete({
				source: function(request, response) {
					$.get("https://nationstatesplusplus.net/api/autocomplete/nation/?start=" + request.term, function(nations) {
						response(nations);
					});
				},
				minLength: 3,
				delay: 50
			});
		}
		
		//Add officer event
		$("#add_officer_btn").on("click", function(event) {
			event.preventDefault();
			
			var event = jQuery.Event("websocket/request");
			event.json = { name: "update_recruitment_officers", data : { add: $("#add_officer").val().toLowerCase().replaceAll(" ", "_")} };
			event.requiresAuth = true;
			$(window).trigger(event);
		});

		//Remove selected officer events
		$("#remove_selected_officers").on("click", function(event) {
			event.preventDefault();
			
			var event = jQuery.Event("websocket/request");
			event.json = { name: "update_recruitment_officers", data : { remove: $("#recruitment_officers").val().join(",") } };
			event.requiresAuth = true;
			$(window).trigger(event);
		});

		//Recruitment type descriptions
		$("#rtype").on("change", function() {
			$("p[name='rdesc']").hide();
			$("#rdesc_" + $("#rtype").val()).show();
			if ($("#rtype").val() == 4) {
				$("#gcrs").prop("checked", false);
				$("#gcrs").attr("disabled", true);
			} else {
				$("#gcrs").removeAttr("disabled");
			}
		});
		$("#rtype").trigger("change");
		
		//Keep allocation slider in sync with textbox
		$("input[name='allocation']").on("change", function() {
			$("input[name='percent_input']").val($(this).val());
		});
		$("input[name='percent_input']").on("change", function() {
			$("input[name='percent_input']").val(Math.max(1, Math.min(100, $(this).val())));
			$("input[name='allocation']").val($("input[name='percent_input']").val());
		});

		//Submission
		$("#submit").on("click", function(event) {
			event.preventDefault();
			$("p[name='error']").hide();
			if ($("#clientkey").val() == "") { $("#missing-client-key").show(); return; }
			if ($("#clientkey").val().length != 8 || $("#clientkey").val().contains(" ")) { $("#invalid-client-key").show(); return; }
			if ($("#tgid").val() == "") { $("#missing-tgid").show(); return; }
			if ($("#secretkey").val() == "") { $("#missing-secret-key").show(); return; }
			if ($("#secretkey").val().length != 12 || $("#secretkey").val().contains(" ")) { $("#invalid-secret-key").show(); return; }
			if (!isNumber($("#tgid").val())) { $("#invalid-tgid").show(); return; }
	
			var data = {};
			data.type = $("#rtype").val();
			data.clientKey = $("#clientkey").val();
			data.secretKey = $("#secretkey").val();
			data.tgid = $("#tgid").val();
			data.allocation = $("input[name='allocation']").val();
			data.gcrsOnly = ($("#gcrs").prop("checked") ? "1" : "0");
			if ($("#filter").val().trim() != "") {
				data.filters = $("#filter").val().trim();
			}
			var event = jQuery.Event("websocket/request");
			event.json = { name: "create_recruitment_campaign", data : data };
			event.requiresAuth = true;
			$(window).trigger(event);
			
			$(window).one("websocket/recruitment_campaigns", function(event) {
				$("#content input[type='text']").val("");
			});
		});
	}
})();

