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
	$(banner).append("<div class='ns-settings'><a href='http://www.nationstates.net/page=ns++' style='right: 10px;'>NS++ Settings</a></div>");
} else {
	$(banner).append("<div class='ns-settings'><a href='http://www.nationstates.net/page=ns++'>NS++ Settings</a></div>");
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

function setLocalStorage(key, value) {
	localStorage.setItem(key, value);
}

function getLocalStorage(key) {
	return localStorage.getItem(key);
}

function removeLocalStorage(key) {
	return localStorage.removeItem(key);
}

window.addEventListener("message", function(event) {
	if (event.source != window)
		return;
	
}, false);
window.postMessage({ method: "send_all_keys"}, "*");

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