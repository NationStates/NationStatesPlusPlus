(function() {
	function addHappenings(existingHappenings, newHappenings) {
		var added = 0;
		$(newHappenings.children().get().reverse()).each(function() {
			var split = $(this).text().split(":");
			var found = false;
			$(existingHappenings.children()).each(function() {
				if ($(this).text().contains(split[1])) {
					var text = $(this).html().substring($(this).html().indexOf(":") + 1);
					$(this).html(split[0] + ":" + text);
					found = true;
					return false;
				}
			});
			if (!found) {
				existingHappenings.prepend("<li>" + $(this).html() + "</li>");
				added += 1;
			}
		});
		return added;
	}
	
	$(window).on("websocket.region_happenings", function(event) {
		$.get(window.location.href + "?nspp=1", function(page) {
			var happenings = findRegionHappenings(page);
			var current = findRegionHappenings();
			var added = addHappenings(current, happenings);
			happeningsIndex += added;
		});
	});
	
	$(window).on("websocket.nation_happenings", function(event) {
		$.get(window.location.href + "?nspp=1", function(page) {
			var happenings = findNationHappenings(page);
			var current = findNationHappenings();
			var added = addHappenings(current, happenings);
			happeningsIndex += added;
		});
	});
	
	function findNationHappenings(page) {
		if (typeof page === "undefined") {
			var x = $(document);
		} else {
			var x = $(page);
		}
		return x.find(".newsbox").find("ul");
	}

	function findRegionHappenings() {
		if (typeof page === "undefined") {
			var x = $(document);
		} else {
			var x = $(page);
		}
		// Rift has an h2 where Century has an h3.
		return x.find("h3:contains('Regional Happenings'),h2:contains('Regional Happenings')").next();
	}
})();
