(function() {
	$.get("http://www.nationstates.net/page=verify_login", function(data) {
		if ($(data).find(".STANDOUT:first").length > 0) {
			var nation = $(data).find(".STANDOUT:first").attr("href").substring(7);
			var authCode = $(data).find("#proof_of_login_checksum").html();
			$(document.body).append("<div id='nspp_user_auth' style='display:none;' user='" + nation + "' auth='" + authCode + "'></div>");
		} else {
			$(document.body).append("<div id='nspp_user_auth' style='display:none;' user=''></div>");
		}
	});
})();