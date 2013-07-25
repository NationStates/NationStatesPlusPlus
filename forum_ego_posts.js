(function() {
	var pageUrl = window.location.href;
	if (window.location.href.indexOf("#") > -1) {
		pageUrl = window.location.href.substring(0, window.location.href.indexOf("#"));
	}
	var nation = "";

	var nationSelector = $("a:contains('Logout'):last");
	if (typeof nationSelector.text() == 'undefined' || nationSelector.text().length == 0) {
		nation = "";
	} else {
		nation = nationSelector.text().substring(9, nationSelector.text().length - 2);
	}

	//Search page
	if (pageUrl.indexOf("/search.php?") > -1) {
		$(".lastpost:not(:first)").parent().append("<button class='ignore-egopost btn' onclick='ignoreEgoPost(this)'><div class='ignore-egopost-body'>Ignore</div></button>");
		$(".lastpost:not(:first)").each(function() {
			var postName = $(this).parent().parent().find(".topictitle").html();
			if (localStorage.getItem(postName) == "true") {
				$(this).parent().parent().hide();
			}
		});
		$(".lastpost:first").parent().append("<button class='showall-egopost btn' onclick='showAllEgoPosts()'><div class='showall-egopost-body'>Show All Posts</div></button>");
	}

	function ignoreEgoPost(post) {
		$(post).parent().parent().animate({ height: 'toggle' }, 500);
		var postName = $(post).parent().parent().find(".topictitle").html();
		localStorage.setItem(postName, "true");
	}

	function showAllEgoPosts() {
		$(".lastpost").each(function() {
			if ($(this).parent().parent().is(':hidden')) {
				$(this).parent().parent().animate({ height: 'toggle' }, 500);
			}
			var postName = $(this).parent().parent().find(".topictitle").html();
			localStorage.removeItem(postName);
		});
	}
})();