if (window.location.href.indexOf("viewtopic.php") != -1) {
	$("div.post").each(function() {
		var marginLeft = 11 + (8 - $(this).attr("id").substring(1).length) * 4.4;
		$(this).find(".profile-icons").prepend("<li class='post-id-icon'><a href=" + pageUrl + "#" + $(this).attr("id") + " title='Post Number' target='_blank'><span class='post-id-text' style='margin-left:" + marginLeft + "px;'>" + $(this).attr("id").substring(1) + "</span></a></li>");
	});
}