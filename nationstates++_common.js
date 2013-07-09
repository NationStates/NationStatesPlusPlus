(function() {
	//Add $.changeElementType
	(function($) {
		$.fn.changeElementType = function(newType) {
			var attrs = {};

			$.each(this[0].attributes, function(idx, attr) {
				attrs[attr.nodeName] = attr.nodeValue;
			});

			this.replaceWith(function() {
				return $("<" + newType + "/>", attrs).append($(this).contents());
			});
		};
	})(jQuery);

	(function($) {
		$.fn.toggleDisabled = function(){
			return this.each(function(){
				this.disabled = !this.disabled;
			});
		};
	})(jQuery);

	//Add string.startsWith
	if (typeof String.prototype.startsWith != 'function') {
		String.prototype.startsWith = function (str){
			return this.slice(0, str.length) == str;
		};
	}

	//Add string.contains
	if (typeof String.prototype.contains != 'function') {
		String.prototype.contains = function (str){
			return this.indexOf(str) != -1;
		};
	}

	//Add string.toTitleCase
	if (typeof String.prototype.toTitleCase != 'function') {
		String.prototype.toTitleCase = function (){
			return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		};
	}
})();

//$("#banner").append("<div class='ns-settings'><img id='signin-button' src='https://dl.dropboxusercontent.com/u/49805/dropbox.png'>Sync with Dropbox</img></div>");
var banner = $("#banner, #nsbanner");
if (banner.children().length == 2) {
	$(banner).append("<div class='ns-settings'><a href='javascript:void(0)' onclick='return showSettings();' style='right: 10px;'>NS++ Settings</a></div>");
} else {
	$(banner).append("<div class='ns-settings'><a href='javascript:void(0)' onclick='return showSettings();'>NS++ Settings</a></div>");
}

function showSettings() {
	console.log("Show settings");
	if ($("#nationstates_settings").length == 0) {
		var forums = $("#wrap").length == 1;
		$.get("http://capitalistparadise.com/nationstates/v1_7/" + (forums ? "forum_" : "region_") + "settings.html", function(data) {
			if (forums) {
				var html = $("#wrap").html();
				$("#wrap").remove();
				$("<div id='main'><div id='wrap' class='beside_nssidebar_1'>" + html + "</div></div>").insertAfter("#nssidebar");
			}
			$("#main").html($("#main").html() + "<div id='nationstates_settings'><div>");
			$("#nationstates_settings").html(data);
			$("#nationstates_settings").hide();
			$("#nationstates_settings").find('input').each(function() {
				var setting = localStorage.getItem($(this).prop("id"));
				$(this).prop("checked", (setting == null || setting == "true"));
			});
			if (!$("#forum_enhancements").prop("checked")) {
				$("#forum_enhancements").toggleDisabled();
			}
			if (!$("#region_enhancements").prop("checked")) {
				$("#region_enhancements").toggleDisabled();
			}
			$("#region_enhancements").on('click', function() {
				$("#region_enhancements_form").find('input').toggleDisabled();
			});
			$("#forum_enhancements").on('click', function() {
				$("#forum_enhancements_form").find('input').toggleDisabled();
			});
			$("#save_button").on("click", function() {
				$("#nationstates_settings").find('input').each(function() {
					localStorage.setItem($(this).prop("id"), $(this).prop("checked"));
				});
				$("#nationstates_settings").hide();
				$("#content, #wrap").show();
				location.reload();
			});
			$("#reset_button").on("click", function() {
				$("#nationstates_settings").find('input').prop("checked", true);
			});
			$("#cancel_button").on("click", function() {
				$("#nationstates_settings").find('input').each(function() {
					var setting = localStorage.getItem($(this).prop("id"));
					$(this).prop("checked", (setting == null || setting == "true"));
				});
				$("#nationstates_settings").hide();
				$("#content, #wrap").show();
			});
			showSettings();
		});
	} else {
		$("#content, #wrap").hide();
		$("#nationstates_settings").show();
	}
	return false;
}

/*
var client = new Dropbox.Client({ key: "sh+9UCcI8gA=|5UEwz9yvpb2/NF8lwYZa1+1/4YDgyTxjylfbkuHvPQ==", sandbox: true});
console.log(client);
client.authDriver( new Dropbox.Drivers.Redirect({ rememberUser: true }) );

// Try to use cached credentials.
client.authenticate({interactive: false}, function(error, client) {
  if (error) {
    console.log(error);
  }
  if (client.isAuthenticated()) {
    // Cached credentials are available, make Dropbox API calls.
    console.log("Cached authentication");
  } else {
    // show and set up the "Sign into Dropbox" button
    var button = document.querySelector("#signin-button");
    button.setAttribute("class", "visible");
    button.addEventListener("click", function() {
      // The user will have to click an 'Authorize' button.
      client.authenticate(function(error, client) {
        if (error) {
          console.log(error);
        }
         console.log("authentication");
      });
    });
  }
});*/

//$("#banner").append("<div class='ns-settings'><a href='javascript:void(0)' onclick='return toggleStickyLoginBox()'>Settings</a></div>");

var _nation = "";
(function() {
	if ($(".STANDOUT:first").attr("href")) {
		_nation = $(".STANDOUT:first").attr("href").substring(7);
	}
})();

/*
	Returns the nation name of the active user, or empty string if no active user.
*/
function getUserNation() {
	return _nation;
}

var _region = "";
(function() {
	if ($(".STANDOUT:eq(1)").attr("href")) {
		_region = $(".STANDOUT:eq(1)").attr("href").substring(7);
	}
})();

/*
	Returns the region name of the active user, or empty string if no active user.
*/
function getUserRegion() {
	return _region;
}

var _visibleNation = "";
(function() {
	if ($(".nationname > a").attr("href")) {
		_visibleNation = $(".nationname > a").attr("href").trim().substring(8);
	}
})();

/*
	Returns the name of the nation the user is currently viewing, or empty string if none.
*/
function getVisibleNation() {
	return _visibleNation;
}

var _visibleRegion = "";
var _visiblePage = "";
var _visibleSorting = "";
var _visibleDilemma = "";
(function() {
	if (window.location.href.contains("region=") != -1) {
		var split = window.location.href.split(/[/#/?]/);
		for (var i = 0; i < split.length; i++) {
			if (split[i].startsWith("region=")) {
				_visibleRegion = split[i].substring(7);
			} else if (split[i].startsWith("page=")) {
				_visiblePage = split[i].substring(5);
			} else if (split[i].startsWith("sort=")) {
				_visibleSorting = split[i].substring(5);
			} else if (split[i].startsWith("dilemma=")) {
				_visibleDilemma = split[i].substring(8);
			}
		}
	}
})();

/*
	Returns the dilemma id number on the page, if any
*/
function getVisibleDilemma() {
	return _visibleDilemma;
}

/*
	Returns the sorting parameter on the page, if any
*/
function getVisibleSorting() {
	return _visibleSorting;
}

/*
	Returns the region the user is currently viewing, or empty string if no region is visible.
*/
function getVisibleRegion() {
	return _visibleRegion;
}

/*
	Returns the visible page the user is viewing.
*/
function getVisiblePage() {
	//We are on the main region page of some region
	if (_visiblePage == "") {
		if (_visibleRegion != "") {
			return "region"
		} else if (_visibleNation != "") {
			return "nation";
		}
		return "unknown";
	}
	return _visiblePage;
}

//console.log("User: " + getUserNation() + ", Region: " + getUserRegion() + ", viewing: " + getVisiblePage() + ", visible nation: " + getVisibleNation() + ", visible region: " + getVisibleRegion());

var _isPageActive;
window.onfocus = function () { 
  _isPageActive = true; 
}; 

window.onblur = function () { 
  _isPageActive = false; 
};

function isPageActive() {
	return _isPageActive;
}

var _lastPageActivity = (new Date()).getTime();
$("#main").mousemove(function (c) {
	_lastPageActivity = (new Date()).getTime();
});

function getLastActivity() {
	return _lastPageActivity;
}

var _isAntiquityTheme = document.head.innerHTML.indexOf("antiquity") != -1;
function isAntiquityTheme() {
	return _isAntiquityTheme;
}

function linkify(inputText) {
	var replacedText, replacePattern1, replacePattern2, replacePattern3;
	
	if (inputText.indexOf("nationstates.net/") > -1) {
		return inputText;
	}

	//URLs starting with http://, https://, or ftp://
	replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

	//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
	replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

	//Change email addresses to mailto:: links.
	replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
	replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function isInRange(min, value, max) {
	if (value > min && value < max) {
		return true;
	}
	return false;
}

function isScrolledIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();
    return ((docViewTop <= elemBottom) && (docViewBottom >= elemTop));
}

var _commonsLoaded = true;