(function(){
	var banhammerHTML = '<form class=form-horizontal><fieldset><div class=control-group><label class=control-label for=checkboxes>Show Nation Flags</label><div class=controls><label class="checkbox inline" for=show_flags><input type=checkbox name=show_flags id=show_flags value=Flags checked>Flags</label></div></div><div class=control-group><label class=control-label for=filter_names>Filter Nations:</label><div class=controls><input id=filter_names name=filter_names placeholder=Filter class=input-xlarge><p class=help-block>Type part of the nation"s name (press enter to execute filter)</p></div></div><div class=control-group><label class=control-label for=radios>Sorting</label><div class=controls><label class=radio for=length_of_residency><input type=radio name=radio_controls id=length_of_residency value="Length of Residency" checked>Length of Residency</label><label class=radio for=influence><input type=radio name=radio_controls id=influence value=Influence>Influence</label></div></div><div class=control-group><label class=control-label for=inversion>Invert Sorting</label><div class=controls><label class="checkbox inline" for=inversion><input type=checkbox name=inversion id=inversion value="(Low to High)">(Low to High)</label></div></div></fieldset></form>';
	if (getVisiblePage() == "blank" && typeof $.QueryString["banhammer"] != "undefined") {
		var region = $.QueryString["banhammer"];
		window.document.title = "Banhammer!";
		$("#content").html("<h1>Ban Management Settings</h1><div id='settings'>" + banhammerHTML + "</div><hr></hr><h1>Nation List <button id='refresh_list' class='button' style='position: relative;top: -8px;left: 25px;'>Refresh</button><span id='your_spdr'></span></h2><div id='nation_list'></div>");
		var updateSPDR = function() {
			getSPDR(getUserNation(), function(spdr) { $("#your_spdr").attr("spdr", spdr); $("#your_spdr").html("(Current SPDR: " + spdr + ")"); });
		}
		var listNations = function() {
			updateSPDR();
			$("#nation_list").html("<img style='margin-bottom: -2px; margin-right: 4px;' src='/images/loading1.gif'>");
			$.get("https://nationstatesplusplus.net/api/region/summary/?region=" + region, function(data) {
				var html = "";
				
				if (!getSettings().isEnabled("banhammer_length_of_residency", true)) $("#influence").prop("checked", true);
				if ($("#length_of_residency").prop("checked")) {
					data = $(data).get().reverse();
				} else {
					data.sort(function(a, b) {
						return b.influence - a.influence;
					});
				}
				$("#nation_list").html("");
				
				if (getSettings().isEnabled("banhammer_inversion", false)) $("#inversion").prop("checked", true);
				if ($("#inversion").prop("checked")) {
					data = $(data).get().reverse();
				}
				
				var filter = $("input[name='filter_names']").val().toLowerCase();
				
				var spdr = parseInt($("#your_spdr").attr("spdr"), 10);
				spdrSquared = spdr * spdr;
				
				var costOverride = (typeof $.QueryString["free"] != "undefined");
				
				for (var i = 0; i < data.length; i++) {
					var nation = data[i];
					
					if (filter == "" || nation.title.toLowerCase().contains(filter)) {
						html += "<div class='banhammer_row' name='" + nation.name + "'><p><a class='nlink' href='//www.nationstates.net/nation=" + nation.name + "' target='_blank' >";
						html += "<img class='bflag miniflag' src='" + nation.flag + "' class='miniflag' alt='' title='" + nation.title + "'><span>"
						html += nation.title + "</span></a> <span class='spdr'>(SPDR: " + nation.influence + ")</span>";
						html += (nation.wa_member ? "<span class='wa_status dossier-wa'></span>" : "");
						
						var ejectCost = (costOverride ? 0 : (nation.influence * nation.influence) * 0.33);
						var banCost = (costOverride ? 0 : (nation.influence * nation.influence) * 0.5);
						
						if (spdrSquared > ejectCost) {
							ejectCost = spdr - Math.sqrt(spdrSquared - ejectCost);
						} else {
							ejectCost = Math.sqrt(ejectCost);
						}
						if (spdrSquared > banCost) {
							banCost = spdr - Math.sqrt(spdrSquared - banCost);
						} else {
							banCost = Math.sqrt(banCost);
						}
						//Eject button
						html += "<span class='banhammer_span' ><button name='eject' class='button icon remove danger eject_banhammer'";
						if (ejectCost > spdr) html += " disabled='true'";
						html += ">Eject (Cost: " + Math.floor(ejectCost * 100) / 100 + " SPDR)</button>";
						
						//Ban button
						html += "<button name='ban_eject' class='button icon remove danger banject_banhammer'";
						if (banCost > spdr) html += " disabled='true'";
						html += ">Ban & Eject (Cost: " + Math.floor(banCost * 100) / 100 + " SPDR)</button></span>"
						
						html += "</p></div>";
					}
				}
				$("#nation_list").html(html);
				var ejectOrBan = function(event, nation, param) {
					event.preventDefault();
					$("button").attr("disabled", true);
					$.get("//www.nationstates.net/nation=" + nation + "?nspp=1", function(data) {
						var chk = $(data).find("input[name='chk']").val();
						$.post("//www.nationstates.net/nation=" + nation + "?nspp=1", "page=display_other_nation&nation=" + nation + "&chk=" + chk + "&" + param, function(data) {
							if ($(data).find("p.info")) {
								$("div[name='" + nation + "']").slideToggle(400);
								 $("button").removeAttr("disabled");
							} else {
								window.alert($(data).find("p.error"));
								 $("button").removeAttr("disabled");
							}
							updateSPDR();
						}).fail(function() { $("button").removeAttr("disabled"); });
					});
				}
				$("button[name='eject']").on("click", function(event) {
					ejectOrBan(event, $(this).parents(".banhammer_row").attr("name"), "eject=1");
				});
				$("button[name='ban_eject']").on("click", function(event) {
					ejectOrBan(event, $(this).parents(".banhammer_row").attr("name"), "ban=1");
				});
				$("input[name='show_flags']").on("click", function(event) {
					if ($(this).prop("checked")) $(".bflag").show();
					else $(".bflag").hide();
					getSettings(true).setValue("banhammer_show_flags", $(this).prop("checked"));
				});
				$("input[name='show_flags']").prop("checked", getSettings().isEnabled("banhammer_show_flags", true));
				if (!getSettings().isEnabled("banhammer_show_flags", true)) $(".bflag").hide();
				
				$("input[name='radio_controls']").on("click", function(event) {
					listNations();
					getSettings(true).setValue("banhammer_length_of_residency", $("#length_of_residency").prop("checked"));
				});
				$("input[name='inversion']").on("click", function(event) {
					listNations();
					getSettings(true).setValue("banhammer_inversion", $("#inversion").prop("checked"));
				});
				$("input[name='filter_names']").on("keydown", function(event) {
					if (event.which == 13) {
						event.preventDefault();
						listNations();
					}
				});
			});
		};
		$("#refresh_list").on("click", function(event) {
			event.preventDefault();
			listNations();
		});
		listNations();
	}
	function getSPDR(nation, callback) {
		$.get("/page=compare/nations=" + nation + "?censusid=65&nspp=1", function(data) {
			var start = data.indexOf("backgroundColor:'rgba(255, 255, 255, 0.1)");
			var search = 'y: ';
			var index = data.indexOf(search, start) + search.length;
			
			//Comparing 2 nations, use 2nd compare
			var other = data.indexOf(search, index + 10);
			if (other > index && other < index + 100) {
				index = other + search.length;
			}
			
			var end = data.indexOf('}', index);
			var score = data.substring(index, end).trim();
			callback(score);
		});
	}

})();

