var pageUrl = window.location.href;
if (window.location.href.indexOf("#") > -1) {
	pageUrl = window.location.href.substring(0, window.location.href.indexOf("#"));
}

var nation = "";

function doSetup() {
	if (typeof jQuery == 'undefined') {
		setTimeout(doSetup, 100);
	} else {
		setupForums();
		update(1);
	}
}
if (document.readyState == "loading") {
	document.addEventListener('DOMContentLoaded', doSetup);
} else {
	doSetup();
}

function setupForums() {
	var nationSelector = $("a:contains('Logout'):last");
	if (typeof nationSelector.text() == 'undefined' || nationSelector.text().length == 0) {
		nation = "";
	} else {
		nation = nationSelector.text().substring(9, nationSelector.text().length - 2);
	}
	console.log("Nation: " + nation);

	$("div.post").each(function() {
		var marginLeft = 11 + (8 - $(this).attr("id").substring(1).length) * 4.4;
		$(this).find(".profile-icons").prepend("<li class='post-id-icon'><a href=" + pageUrl + "#" + $(this).attr("id") + " title='Post Number' target='_blank'><span class='post-id-text' style='margin-left:" + marginLeft + "px;'>" + $(this).attr("id").substring(1) + "</span></a></li>");
	});

	//Search page
	if (pageUrl.indexOf("/search.php?") > -1) {
		$(".lastpost:not(:first)").parent().append("<button class='ignore-egopost btn' onclick='ignoreEgoPost(this)'><div class='ignore-egopost-body'>Ignore</div></button>");
		$(".lastpost:not(:first)").each(function() {
			var postName = $(this).parent().parent().find(".topictitle").html();
			if (getLocalStorage(postName) == "true") {
				$(this).parent().parent().hide();
			}
		});
		$(".lastpost:first").parent().append("<button class='showall-egopost btn' onclick='showAllEgoPosts()'><div class='showall-egopost-body'>Show All Posts</div></button>");
	}
	

}

function ignoreEgoPost(post) {
	$(post).parent().parent().animate({ height: 'toggle' }, 500);
	var postName = $(post).parent().parent().find(".topictitle").html();
	setLocalStorage(postName, "true");
}

function showAllEgoPosts() {
	$(".lastpost").each(function() {
		if ($(this).parent().parent().is(':hidden')) {
			$(this).parent().parent().animate({ height: 'toggle' }, 500);
		}
		var postName = $(this).parent().parent().find(".topictitle").html();
		removeLocalStorage(postName);
	});
}

var _gaq = _gaq || [];
function update(delay){
	setTimeout(function() {
		_gaq.push(['_setAccount', 'UA-41267101-1']);
		_gaq.push(['_trackPageview']);
		_gaq.push(['_setCustomVar', 1, 'Version', 'v1.66', 2]);

		if (delay == 1) {
			_gaq.push(['_trackEvent', 'Forum', 'Page', pageUrl]);
			_gaq.push(['_trackEvent', 'Forum', 'Nation', (nation.length > 0 ? nation : "unknown")]);
		}
		update(60000);
	}, delay);
}