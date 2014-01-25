(function(){
	if (getVisiblePage() == "blank" && typeof $.QueryString["banhammer"] != "undefined") {
		var region = $.QueryString["banhammer"];
		window.document.title = "Banhammer!";
		$("#content").html("<h1>Ban Management Settings</h1><div id='settings'></div><hr></hr><h1>Nation List <button id='refresh_list' class='button' style='position: relative;top: -8px;left: 25px;'>Refresh</button><span id='your_spdr'></span></h2><div id='nation_list'></div>");
		$.get("http://nationstatesplusplus.net/nationstates/v2_3/banhammer.html", function(html) {
			$("#settings").html(html);
		});
		var updateSPDR = function() {
			getSPDR(getUserNation(), function(spdr) { $("#your_spdr").attr("spdr", spdr); $("#your_spdr").html("(Current SPDR: " + spdr + ")"); });
		}
		var listNations = function() {
			updateSPDR();
			$("#nation_list").html("<img style='margin-bottom: -2px; margin-right: 4px;' src='/images/loading1.gif'>");
			$.get("http://nationstatesplusplus.net/api/region/summary/?region=" + region, function(data) {
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
				
				var costOverride = (typeof $.QueryString["free"] != "undefined");
				
				for (var i = 0; i < data.length; i++) {
					var nation = data[i];
					
					if (filter == "" || nation.title.toLowerCase().contains(filter)) {
						html += "<div class='banhammer_row' name='" + nation.name + "'><p><a class='nlink' href='http://www.nationstates.net/nation=" + nation.name + "' target='_blank' >";
						html += "<img class='bflag miniflag' src='" + nation.flag + "' class='miniflag' alt='' title='" + nation.title + "'><span>"
						html += nation.title + "</span></a> <span class='spdr'>(SPDR: " + nation.influence + ")</span>";
						
						var ejectCost = (costOverride ? 0 : nation.influence * 0.6);
						var banCost = (costOverride ? 0 : nation.influence * 0.7);
						
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
					$.get("http://www.nationstates.net/nation=" + nation, function(data) {
						var chk = $(data).find("input[name='chk']").val();
						$.post("http://www.nationstates.net/nation=" + nation, "page=display_other_nation&nation=" + nation + "&chk=" + chk + "&" + param, function(data) {
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
})();

