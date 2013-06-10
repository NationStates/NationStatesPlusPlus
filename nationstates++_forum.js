var css = '.post-id-icon, .post-id-icon a		{width:85px; height:20px; background-image: url("http://capitalistparadise.com/nationstates/static/post_id.gif"); }';
css += '.post-id-icon a		{ color: black; text-decoration: none; }';
css += '.post-id-text {font-weight:bold; letter-spacing: 1px; color:#BC2A4C; text-align:center; margin-left:11px; margin-top:3px; display:inline-block !important;}';
css += '.ignore-egopost {float:right; margin-top:6px; margin-right:5px; width:50px; height:20px;}';
css += '.ignore-egopost-body {font-size:10px; font-weight:bold; margin-left:-3px; margin-top:-5px;}';
css += '.showall-egopost {float:right; margin-bottom:4px; width:110px; height:20px;}';
css += '.showall-egopost-body {font-size:10px; font-weight:bold; margin-left:-3px; margin-top:-5px;}';

var style = document.createElement('style');
style.type = 'text/css';
if (style.styleSheet){
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}
document.head.appendChild(style);

var pageUrl = window.location.href;
if (window.location.href.indexOf("#") > -1) {
	pageUrl = window.location.href.substring(0, window.location.href.indexOf("#"));
}

function doSetup() {
	if (typeof jQuery == 'undefined') {
		setTimeout(doSetup, 100);
	} else {
		setupForums();
	}
}
if (document.readyState == "loading") {
	document.addEventListener('DOMContentLoaded', doSetup);
} else {
	doSetup();
}

function setupForums() {
	$("div.post").each(function() {
		var marginLeft = 11 + (8 - $(this).attr("id").substring(1).length) * 4.4;
		$(this).find(".profile-icons").prepend("<li class='post-id-icon'><a href=" + pageUrl + "#" + $(this).attr("id") + " title='Post Number' target='_blank'><span class='post-id-text' style='margin-left:" + marginLeft + "px;'>" + $(this).attr("id").substring(1) + "</span></a></li>");
	});

	//Search page
	if (pageUrl.indexOf("/search.php?") > -1) {
		$(".lastpost:not(:first)").parent().append("<button class='btn ignore-egopost' onclick='ignoreEgoPost(this)'><div class='ignore-egopost-body'>Ignore</div></button>");
		$(".lastpost:not(:first)").each(function() {
			var postName = $(this).parent().parent().find(".topictitle").html();
			if (getLocalStorage(postName) == "true") {
				$(this).parent().parent().hide();
			}
		});
		$(".lastpost:first").parent().append("<button class='btn showall-egopost' onclick='showAllEgoPosts()'><div class='showall-egopost-body'>Show All Posts</div></button>");
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
update(1);
function update(delay){
	setTimeout(function() {
		_gaq.push(['_setAccount', 'UA-41267101-1']);
		_gaq.push(['_trackPageview']);
		_gaq.push(['_setCustomVar', 1, 'Version', 'v1.6', 2]);

		if (delay == 1) {
			_gaq.push(['_trackEvent', 'Forum', 'Page', pageUrl]);
		}
		update(60000);
	}, delay);
}