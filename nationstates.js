var quote = '<button id="quote-btn-${id}" class="button QuoteButton" onclick="quotePost(this);">Quote</button>';
(function() {
	window.postMessage({ method: "unread_forum_posts"}, "*");
	checkPanelAlerts();
	addCustomAlerts();
})();

function addCustomAlerts() {
	if (localStorage.getItem("show_admin_area") == "true") {
	//	$(".menu").append("<li><a id='nationbot' href='http://capitalistparadise.com/api/nationbot/'>NATIONBOT ONLINE</a></li>");
	}
}

var _lastPanelUpdate = 0;
function checkPanelAlerts() {
	//console.log("Checking Panel Alerts: " + Date.now());
	setTimeout(function() {
		var updateDelay = 10000; //10 sec
		if (!isPageActive()) {
			updateDelay = 300000; //5 min
		} else if (getLastActivity() + 60000 < Date.now()) {
			updateDelay = 150000; //2.5 min
		}
		if (Date.now() > (_lastPanelUpdate + updateDelay)) {
			_lastPanelUpdate = Date.now();
			updatePanelAlerts();
		}
		checkPanelAlerts();
	}, 10000);
}

window.addEventListener("message", function(event) {
	if (event.data.method == "unread_forum_posts_amt") {
		console.log("Unread forum posts: " + event.data.amt);
		if (event.data.amt != _unreadForumPosts) {
			_unreadForumPosts = event.data.amt;
			$("#panel").find("a").each(function() {
				if ($(this).html().indexOf("FORUM") != -1) {
					$(this).html("FORUM (" + _unreadForumPosts + ")");
					return false;
				}
			});
		}
	}
}, false);

var _panelForumLink = null;
var _unreadForumPosts = 0;
function updatePanelAlerts() {
	var unread = 0;
	if (getUserNation() != "") {
		window.postMessage({ method: "unread_forum_posts"}, "*");
		$.get('/page=panel/template-overall=none', function(html) {
			var searchString = '<a href="page=telegrams">';
			var indicatorStart = html.indexOf(searchString);
			var indicatorEnd = html.indexOf('</a>', indicatorStart);
			$('a[href$="page=telegrams"]').html(html.substring(indicatorStart + searchString.length, indicatorEnd));
		});
	}
}