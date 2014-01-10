(function(){
	if (getVisiblePage() == "blank" && typeof $.QueryString["banhammer"] != "undefined") {
		var region = $.QueryString["banhammer"];
		window.document.title = "Banhammer!";
		$.get("http://nationstatesplusplus.net/api/region/nations/?region=" + region, function(data) {
			var html = "";
			for (var i = 0; i < data.length; i++) {
				var nation = data[i];
				html += "<div class='banhammer_row' name='" + nation + "'><p><a class='nlink' href='http://www.nationstates.net/nation=" + nation + "' target='_blank' >";
				html += "<img src='http://nationstatesplusplus.net/api/flag/nation/?nation=" + nation + "' class='miniflag' alt='' title='" + nation.replaceAll("_", " ").toTitleCase() + "'><span>"
				html += nation.replaceAll("_", " ").toTitleCase() + "</span></a>";
				
				html += "<span class='banhammer_span' ><button name='eject' class='button icon remove danger'>Eject</button><button name='ban_eject' class='button icon remove danger'>Ban & Eject</button></span>"
				
				html += "</p></div>";
			}
			$("#content").html(html);
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
					}).fail(function() { $("button").removeAttr("disabled"); });
				});
			}
			$("button[name='eject']").on("click", function(event) {
				ejectOrBan(event, $(this).parents(".banhammer_row").attr("name"), "eject=1");
			});
			$("button[name='ban_eject']").on("click", function(event) {
				ejectOrBan(event, $(this).parents(".banhammer_row").attr("name"), "ban=1");
			});
		});
	}
})();

