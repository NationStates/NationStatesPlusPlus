(function(){
	var recruitmentHTML = '<h1>NationStates++ Recruitment</h1><h2 style="position: relative; left: 410px; top: -20px; font-style: italic; width: 100px;">Beta</h2><form class="form-horizontal"><div class="control-group"><h2>Existing Recruitment Campaigns</h2><ul id="campaigns"><li>No Active Campaigns</li></ul></div><hr><div class="control-group"><h2>Retired Recruitment Campaigns</h2><ul id="retired-campaigns"><li>No Past Campaigns</li></ul></div><hr><div class="control-group"><h2>Recruitment Officers</h2><div style="margin: 8px">Recruitment Officers can contribute to your regions recruitment, view and edit recruitment campaigns.</div><div style="margin: 8px">Only the regional founder and regional delegate can appoint or remove recruitment officers.</div><label class="control-label" for="recruitment_officers">Recruitment Officers</label><select id="recruitment_officers" name="recruitment_officers" class="input-xlarge" style="width: 460px; height: 200px; margin-left: 24px" multiple><option>Option one</option><option>Option two</option></select></div><div class="control-group"><div class="controls"><button id="remove_selected_officers" name="remove_selected_officers" class="btn btn-danger">Remove Selected Officers</button></div></div><div class="control-group"><label class="control-label" for="add_officer">Add Officer</label><div class="controls"><div class="input-append"><input id="add_officer" name="add_officer" class="input-xlarge" placeholder="Really Cool Nation" style="width: 450px" type="text"><div class="btn-group"><button id="add_officer_btn" class="btn" style="height: 32px">Add Officer</button></div></div><span id="officer_error" style="display:none; color: red">Not a valid nation</span> <span id="officer_duplicate" style="display:none; color: red">Nation is already an editor!</span></div></div><hr><div class="control-group"><label class="control-label" for="rtype">Recruitment Type</label><div class="controls"><select id="rtype" name="rtype" style="width:465px" class="input-xlarge"><option value="0">New Nations</option><option value="1">Refounded Nations</option><option value="2">Ejected Nations</option><option value="3">Active Gamerites</option><option value="4">Active Userites</option><option value="5">Active Nations</option><option value="6">Capitalist Nations</option><option value="7">Socialist Nations</option><option value="8">Centrist Nations</option><option value="9">Authoritarian Nations</option><option value="10">Libertarian Nations</option><option value="11">Lonely Nations</option></select></div><div style="margin-left: 184px; margin-bottom: -20px"><p id="rdesc_0" name="rdesc" style="display:none">New Nations: Nations founded recently.</p><p id="rdesc_1" name="rdesc" style="display:none">Refounded Nations: Nations that ceased to exist and were refounded.</p><p id="rdesc_2" name="rdesc" style="display:none">Ejected Nations: Nations that have been forcibly relocated to the Rejected Realms.</p><p id="rdesc_3" name="rdesc" style="display:none">Active Gamerites: Nations residing in Game-Created Regions that are active in NationStates.</p><p id="rdesc_4" name="rdesc" style="display:none">Active Userites: Nations residing in User-Created Regions that are active in NationStates.</p><p id="rdesc_5" name="rdesc" style="display:none">Active Nations: Nations that are active in NationStates.</p><p id="rdesc_6" name="rdesc" style="display:none">Capitalist Nations: Active, new, or refounded nations with right-wing, capitalist views.</p><p id="rdesc_7" name="rdesc" style="display:none">Socialist Nations: Active, new, or refounded nations with left-wing, socialist views.</p><p id="rdesc_8" name="rdesc" style="display:none">Centrist Nations: Active, new, or refounded nations with centrist, inoffensive views.</p><p id="rdesc_9" name="rdesc" style="display:none">Authoritarian Nations: Active, new, or refounded nations that favour authoritarianism, dictators, or fascists.</p><p id="rdesc_10" name="rdesc" style="display:none">Libertarian Nations: Active, new, or refounded nations that favour libertarianism, tiny governments and an emphasis on civil and political rights.</p><p id="rdesc_11" name="rdesc" tyle="display:none;">Lonely Nations: Nations residing in tiny regions, with very few members.</p></div></div><div class="control-group"><label class="control-label" for="clientkey">Client Key</label><div class="controls"><input id="clientkey" name="clientkey" type="text" placeholder="Client Key" style="width:450px" class="input-xlarge"><span title="A Client Key can be requested from a Getting Help Request. Once it has been requested, it may take up to 24 hours for the request to be filled, so be patient." style="font-size:10px"><a href="/page=help?recruitment">(What is this?)</a></span></div></div><div class="control-group"><label class="control-label" for="tgid">Telegram ID</label><div class="controls"><input id="tgid" name="tgid" type="text" placeholder="Telegram ID" style="width:450px" class="input-xlarge"><span title="Send your recruitment telegram to &quot;tag:api&quot; to receive a tgid and secret key" style="font-size:10px"><a href="//www.nationstates.net/pages/api.html#telegrams">(What is this?)</a></span></div></div><div class="control-group"><label class="control-label" for="secretkey">Secret Key</label><div class="controls"><input id="secretkey" name="secretkey" type="text" placeholder="Secret Key" style="width:450px" class="input-xlarge"><span title="Send your recruitment telegram to &quot;tag:api&quot; to receive a tgid and secret key" style="font-size:10px"><a href="//www.nationstates.net/pages/api.html#telegrams">(What is this?)</a></span></div></div><div class="control-group"><label class="control-label" for="allocation">Percent Allocated</label><div class="controls"><input id="allocation" name="allocation" type="range" min="1" value="100" max="100" style="width: 414px; margin-right: 10px" placeholder="" class="input-xlarge"><span style="font-size:10px"><input style="min-width:26px; width:26px" class="text-input" name="percent_input" type="text" max="100" min="1" size="2" value="100">(Percent of requests allocated)</span></div></div><div class="control-group"><label class="control-label" for="gcrs">GCR\'s Only</label><div class="controls"><label class="checkbox inline" for="gcrs"><input type="checkbox" name="gcrs" id="gcrs" value="(Arnhelm Signatories)">(Arnhelm Signatories)</label></div></div><div class="control-group"><label class="control-label" for="filter">Filter Names</label><div class="controls"><input id="filter" name="filter" type="text" placeholder="Filter Names (Optional)" style="width:450px" class="input-xlarge"><p class="help-block">Comma separated list</p></div></div><div style="margin-left: 184px"><p id="missing-client-key" name="error" style="display:none; color:red">Missing Client Key.</p><p id="missing-tgid" name="error" style="display:none; color:red">Missing Telegram ID.</p><p id="missing-secret-key" name="error" style="display:none; color:red">Missing Secret Key.</p><p id="invalid-tgid" name="error" style="display:none; color:red">Invalid Telegram ID, Telegram ID\'s are numeric.</p><p id="unknown-error" name="error" style="display:none; color:red"></p></div><div class="control-group"><label class="control-label" for="submit"></label><div class="controls"><button id="submit" name="submit" class="btn btn-success">Create Recruitment Campaign</button></div></div></form>'
	var recruitmentTypes = ["New Nations", "Refounded Nations", "Ejected Nations", "Active Gamerites", "Active Userites", "Active Nations", "Capitalist Nations", "Socialist Nations", "Centrist Nations", "Authoritarian Nations", "Libertarian Nations", "Lonely Nations"];

	function recruitment() {
		$.get("https://nationstatesplusplus.net/api/recruitment/officers/get?region=" + getUserRegion() + "&includeAdmins=true", function(data) {
			if (data != null) {
				console.log(data);
				for (var i = 0; i < data.length; i += 1) {
					if (data[i].name == getUserNation()) {
						checkForRecruitment();
						$("#recruit-admin").show();
					}
				}
			}
		});
	}

	function checkForRecruitment() {
		doAuthorizedPostRequest("https://nationstatesplusplus.net/api/recruitment/campaign/?region=" + getUserRegion(), "", function(data) {
			for (var i = 0; i < data.length; i += 1) {
				if (data[i].retired == 0) {
					setupRecruitment();
					return;
				}
			}
		});
	}

	function setupRecruitment() {
		if (getVisiblePage() != "panel" && getVisiblePage() != "hpanel") {
			var rProgress = "<div id='rprogress'><span id='rprogress-text'><i class='fa fa-envelope-o' style='margin-right: 5px;'></i>Telegramming: <span id='tg-nation'></span></span><span id='r-sender'></span><div id='rprogress-bar'></div></div>";
			$("body").prepend(rProgress);
			$("#content").css("margin-top", "20px");
			if ($(".regional_power").length > 0) {
				$(".regional_power").css("top", ($(".regional_power").position().top + 20) + "px");
			}
		}
		//Support old browsers that do not allow css calc
		if ($("#rprogress").width() < 10) {
			$(window).resize(function() {
				$("#rprogress").width($("#content").width() + 25);
			});
			$(window).trigger("resize");
		}
		updateRecruitmentProgress();
		var data = localStorage.getItem(getUserNation() + "-last-recruitment-data")
		var error = localStorage.getItem(getUserNation() + "-last-recruitment-error")
		if (data != null) {
			data = JSON.parse(data);
			updateRecruitmentNation(data.nation);
			if (data.recruiter && data.recruiter != getUserNation()) {
				console.log(data.recruiter);
				$("#rprogress").css("opacity", "0.3");
				$("#r-sender").html("Sent by " + data.recruiter.replaceAll("_", " ").toTitleCase());
			}
		} else if (error != null) {
			$("#tg-nation").html("Error, " + error);
		}
	}

	function updateRecruitmentNation(name) {
		$("#tg-nation").html("<a style='color:white;' href='/nation=" + name + "'>" + name.replaceAll("_", " ").toTitleCase() + "</a>");
	}

	function updateRecruitmentProgress() {
		var progress = localStorage.getItem(getUserNation() + "-last-recruitment");
		if (progress != null && parseInt(progress) + 180000 < Date.now()) {
			localStorage.removeItem(getUserNation() + "-last-recruitment");
			localStorage.removeItem(getUserNation() + "-last-recruitment-data");
			localStorage.removeItem(getUserNation() + "-last-recruitment-error");
			progress = null;
			if (getVisiblePage() != "panel" && getVisiblePage() != "hpanel") {
				$("#rprogress-bar").width($("#rprogress").width());
			}
		}
		if (progress != null) {
			if (getVisiblePage() != "panel" && getVisiblePage() != "hpanel") {
				$("#rprogress-bar").width($("#rprogress").width() * ((Date.now() - parseInt(progress)) / 180000));
			}
			setTimeout(updateRecruitmentProgress, 100);
		} else if (isPageActive()) {
			updateRecruitment();
		} else {
			setTimeout(updateRecruitment, 3000 + Math.random() * 5000);
		}
	}

	function updateRecruitment() {
		doAuthorizedPostRequest("https://nationstatesplusplus.net/api/recruitment/target/get?region=" + getUserRegion(), "", function(data) {
			if (data.wait) {
				if (data.nation) {
					localStorage.setItem(getUserNation() + "-last-recruitment", data.timestamp);
					localStorage.setItem(getUserNation() + "-last-recruitment-data", JSON.stringify(data));
					updateRecruitmentNation(data.nation);
					updateRecruitmentProgress();
					if (data.recruiter != getUserNation()) {
						$("#rprogress").css("opacity", "0.3");
						$("#r-sender").html("Sent by " + data.recruiter.replaceAll("_", " ").toTitleCase());
					}
				} else {
					setTimeout(updateRecruitmentProgress, 30000);
				}
			} else {
				$("#rprogress").css("opacity", "1");
				$("#r-sender").html("");
				updateRecruitmentNation(data.nation);
				recruitNation(data);
			}
		}, function() {
			$("#tg-nation").html("Error, Reconnecting...");
			setTimeout(updateRecruitmentProgress, 5000);
		});
	}

	function recruitNation(data) {
		$.get("//www.nationstates.net/cgi-bin/api.cgi?a=sendTG&client=" + data.client_key + "&tgid=" + data.tgid + "&key=" + data.secret_key + "&to=" + data.nation, function(result) {
			doAuthorizedPostRequest("https://nationstatesplusplus.net/api/recruitment/target/confirm?region=" + getUserRegion() + "&target=" + data.nation, "", function() {
				localStorage.setItem(getUserNation() + "-last-recruitment", Date.now());
				localStorage.setItem(getUserNation() + "-last-recruitment-data", JSON.stringify(data));
				setTimeout(updateRecruitmentProgress, 100);
			});
		}).fail(function(result, textStatus, jqXHR) {
			localStorage.setItem(getUserNation() + "-last-recruitment", Date.now());
			$("#tg-nation").html("Error, " + result.statusText);
			localStorage.setItem(getUserNation() + "-last-recruitment-error", result.statusText);
			setTimeout(updateRecruitment, 100);
		});
	}

	if (getUserNation() != "") {
		recruitment();
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

		function generateCampaignHTML(campaign) {
			var html = ""
			html += "<li name='campaign' data-cid='" + campaign.id + "'><h3 style='margin-bottom: 0px;'>" + (new Date(campaign.created)).customFormat("#DDD# #MMM#, #YYYY#") + " - Present";
			html += "<span style='font-weight:normal; font-size:14px; margin-left:115px;'><a href='#campaign' data-cid='" + campaign.id + "'>View Campaign";
			html += "<span class='arrow-down'></span>";
			html += "</a></span></h3>";

			html += "<div style='display:none' data-cid='" + campaign.id + "'>";
			html += "<table class='table table-hover' style='width: 500px'><tbody><tr><td>Recruitment Type:</td><td> " + recruitmentTypes[campaign.type] + "</td></tr>";
			html += "<tr><td>Allocation:</td><td> " + campaign.allocation + "%</td></tr>";
			html += "<tr><td>Client Key:</b></td><td> " + campaign.client_key + "</td></tr>";
			html += "<tr><td>Telegram ID:</b></td><td> " + campaign.tgid + "</td></tr>";
			html += "<tr><td>Secret Key:</b></td><td> " + campaign.secret_key + "</td></tr>";
			html += "<tr><td>Total Telegrams Sent:</b></td><td> Coming Soon!</td></tr>";
			html += "<tr><td>Recruited Nations:</b></td><td> Coming Soon!</td></tr>";
			html += "<tr><td>Pending Recruits:</b></td><td> Coming Soon!</td></tr>";
			html += "<tr><td>Recruited & Deceased:</b></td><td> Coming Soon!</td></tr>";
			html += "</tbody></table>";
			if (campaign.retired == 0) {
				html += "<button name='retire' data-cid='" + campaign.id + "' class='btn btn-danger'>Retire Campaign</button>";
			}
			html += "</div>";
			return html;
		}

		doAuthorizedPostRequest("https://nationstatesplusplus.net/api/recruitment/campaign/?region=" + region, "", function(data) {
			var html = "";
			for (var i = 0; i < data.length; i += 1) {
				if (data[i].retired == 0) {
					html += generateCampaignHTML(data[i]);
				}
			}
			$("#campaigns").html(html);
			html = "";
			for (var i = 0; i < data.length; i += 1) {
				if (data[i].retired != 0) {
					html += generateCampaignHTML(data[i]);
				}
			}
			$("#retired-campaigns").html(html);
		}, function() {
			$("#campaigns").html("<li>You do not have permission to view active recruitment campaigns</li>");
			$("#retired-campaigns").html("<li>You do not have permission to view past recruitment campaigns</li>");
			$("#content").find("input, button, select").attr("disabled", true);
		});
		
		$("body").on("click", "button[name='retire']", function(event) {
			event.preventDefault();
			if ($(this).html() != "Are you sure?") {
				$(this).html("Are you sure?");
			} else {
				doAuthorizedPostRequest("https://nationstatesplusplus.net/api/recruitment/campaign/retire?region=" + region + "&id=" + $(this).data("cid"), "", function() {
					window.location.reload(true);
				});
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
			div.animate({height: 'toggle'}, 1000);
			
		});

		//Fetch officers list
		var updateOfficers = function() {
			$("#recruitment_officers").html("");
			$("#add_officer").val("");
			$.get("https://nationstatesplusplus.net/api/recruitment/officers/get?time=" + Date.now() + "&region=" + region, function(data) {
				var html = "";
				for (var i = 0; i < data.length; i += 1) {
					html += "<option value='" + data[i].name + "'>" + data[i].full_name + "</option>";
				}
				$("#recruitment_officers").html(html);
				if (data.length >= 5) {
					$("#add_officer_btn").attr("disabled", true);
					$("#add_officer_btn").attr("title", "Maximum officer limit reached.");
				}
			});
		}
		updateOfficers();

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
			doAuthorizedPostRequest("https://nationstatesplusplus.net/api/recruitment/officers/set?region=" + region, "add=" + $("#add_officer").val().toLowerCase().replaceAll(" ", "_"), updateOfficers);
		});

		//Remove selected officer events
		$("#remove_selected_officers").on("click", function(event) {
			event.preventDefault();
			$("#remove_selected_officers").attr("disabled", true);
			var selected = $("#recruitment_officers").val();
			doAuthorizedPostRequest("https://nationstatesplusplus.net/api/recruitment/officers/set?region=" + region, "remove=" + selected.join(","), function() {
				for (var i = 0; i < selected.length; i += 1) {
					$("#recruitment_officers").find("option[value=" + selected[i] + "]").remove();
				}
				$("#remove_selected_officers").removeAttr("disabled");
			}, function(data, textStatus, jqXHR) {
				console.log(jqXHR.responseText);
			});
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
			if ($("#tgid").val() == "") { $("#missing-tgid").show(); return; }
			if ($("#secretkey").val() == "") { $("#missing-secret-key").show(); return; }
			if (!isNumber($("#tgid").val())) { $("#invalid-tgid").show(); return; }
			var postData = "type=" + $("#rtype").val() + "&clientKey=" + $("#clientkey").val() + "&tgid=" + $("#tgid").val() + "&secretKey=" + $("#secretkey").val();
			postData += "&allocation=" + $("input[name='allocation']").val() + "&gcrsOnly=" + ($("#gcrs").prop("checked") ? "1" : "0");
			if ($("#filter").val().trim() != "") {
				postData += "&filters=" + $("#filter").val().trim();
			}
			doAuthorizedPostRequest("https://nationstatesplusplus.net/api/recruitment/campaign/create?region=" + region, postData, function() {
				window.location.reload(true);
			}, function(data, textStatus, jqXHR) {
				$("#unknown-error").html(data.responseText).show();
			});
		});
	}
})();

