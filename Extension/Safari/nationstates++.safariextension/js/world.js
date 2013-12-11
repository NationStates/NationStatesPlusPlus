(function() {
	if (getVisiblePage() == "world") {
		//Add change region/create region links
		var bulletChar = $('<div/>').html(" &#8226; ").text();
		$("<div style='margin-top:-10px; margin-bottom: 8px;'><a href='page=change_region'>Move to a New Region</a>" + bulletChar + "<a href='page=create_region'>Create a New Region</a></div>").insertBefore($("fieldset.featuredregion"));
	}
})();