(function() {
	if (window.location.href.indexOf("nationstatesplusplus") != -1 && window.location.href.indexOf("api.html") != -1) {
		$.get("//www.nationstates.net/page=verify_login?nspp=1", function(data) {
			if ($(data).find(".STANDOUT:first").length > 0) {
				var nation = $(data).find(".STANDOUT:first").attr("href").substring(7);
				var authCode = $(data).find("#proof_of_login_checksum").html();
				$(document.body).append("<div id='nspp_user_auth' style='display:none;' user='" + nation + "' auth='" + authCode + "'></div>");
			} else {
				$(document.body).append("<div id='nspp_user_auth' style='display:none;' user=''></div>");
			}
		});
	}
})();