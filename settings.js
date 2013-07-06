var hiddenStyle = null;
//Old way of making ajax calls, as jquery is not loaded yet
var xhReq = new XMLHttpRequest();
xhReq.open("GET", "http://capitalistparadise.com/nationstates/v1_7/settings.html", true);
xhReq.send(null);

//This style prevents the error message from appearing before we can change the html
hiddenStyle = document.createElement('style');
hiddenStyle.type = 'text/css';
if (hiddenStyle.styleSheet){
	hiddenStyle.styleSheet.cssText = "#main div, #content div { display: none; }";
} else {
	hiddenStyle.appendChild(document.createTextNode("#main div, #content div { display: none; }"));
}
document.head.appendChild(hiddenStyle);

//Set page title
document.title = "NationStates++ Settings";

function initialize() {
	if (typeof jQuery == "undefined" || xhReq.readyState != 4) {
		setTimeout(initialize, 10);
		return
	}

	$(document).ready(function(){
		$("#content").html(xhReq.response);
		setTimeout(function() {
			document.head.removeChild(hiddenStyle);
		}, 250);
		
		if (settings_data != null) {
			for (var key in settings_data) {
				if (settings_data.hasOwnProperty(key) && key != "method") {
					document.getElementById(key).checked = settings_data[key];
					//console.log("Key: " + key + " value: " + settings_data[key]);
				}
			}
		}
		if ($('#forum_enhancements').prop('checked') == false) {
			$("#forum_enhancements_form").find('input').toggleDisabled();
		}
		if ($('#region_enhancements').prop('checked') == false) {
			$("#region_enhancements_form").find('input').toggleDisabled();
		}
		$("#save_button").on("click", function() {
			if (settings_data != null) {
				for (var key in settings_data) {
					if (settings_data.hasOwnProperty(key) && key != "method") {
						settings_data[key] = document.getElementById(key).checked;
						//console.log("Key: " + key + " value: " + settings_data[key]);
					}
				}
			}
			settings_data.method = "saving_settings";
			window.postMessage(settings_data, "*");
			$('#settings').fadeTo(1000, 0.2);
			$("#saving_modal").dialog({
				title: "Saving Settings",
				height: 140,
				modal: true
			});
		});
	});
}
initialize();

var settings_data = null;

window.addEventListener("message", function(event) {
	if (event.source != window)
		return;
	if (event.data.method == "all_settings") {
		settings_data = event.data;
	} else if (event.data.method == "settings_saved") {
		setTimeout(function() {
			$('#settings').fadeTo(1000, 1);
			var oldHtml = $('#saving_modal').html();
			$('#saving_modal').html("<p>Saved Successfully!</p>");
			setTimeout(function() {
				$("#saving_modal").dialog( "destroy" );
				$('#saving_modal').html(oldHtml);
			}, 1000);
		}, 2000);
	}
}, false);
window.postMessage({ method: "send_all_settings"}, "*");
