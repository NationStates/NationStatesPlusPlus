function _commonsSetup() {
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

//*** This code is copyright 2002-2003 by Gavin Kistner, !@phrogz.net
//*** It is covered under the license viewable at http://phrogz.net/JS/_ReuseLicense.txt
	if (typeof Date.prototype.customFormat != 'function') {
		Date.prototype.customFormat = function(formatString) {
			var YYYY,YY,MMMM,MMM,MM,M,DDDD,DDD,DD,D,hhh,hh,h,mm,m,ss,s,ampm,AMPM,dMod,th;
			var dateObject = this;
			YY = ((YYYY=dateObject.getFullYear())+"").slice(-2);
			MM = (M=dateObject.getMonth()+1)<10?('0'+M):M;
			MMM = (MMMM=["January","February","March","April","May","June","July","August","September","October","November","December"][M-1]).substring(0,3);
			DD = (D=dateObject.getDate())<10?('0'+D):D;
			DDD = (DDDD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dateObject.getDay()]).substring(0,3);
			th=(D>=10&&D<=20)?'th':((dMod=D%10)==1)?'st':(dMod==2)?'nd':(dMod==3)?'rd':'th';
			formatString = formatString.replace("#YYYY#",YYYY).replace("#YY#",YY).replace("#MMMM#",MMMM).replace("#MMM#",MMM).replace("#MM#",MM).replace("#M#",M).replace("#DDDD#",DDDD).replace("#DDD#",DDD).replace("#DD#",DD).replace("#D#",D).replace("#th#",th);

			h=(hhh=dateObject.getHours());
			if (h==0) h=24;
			if (h>12) h-=12;
			hh = h<10?('0'+h):h;
			AMPM=(ampm=hhh<12?'am':'pm').toUpperCase();
			mm=(m=dateObject.getMinutes())<10?('0'+m):m;
			ss=(s=dateObject.getSeconds())<10?('0'+s):s;
			return formatString.replace("#hhh#",hhh).replace("#hh#",hh).replace("#h#",h).replace("#mm#",mm).replace("#m#",m).replace("#ss#",ss).replace("#s#",s).replace("#ampm#",ampm).replace("#AMPM#",AMPM);
		};
	}
//*** END OF LICENSED CODE BY GAVEN KISTNER ***//

	_setupVariables();
	_commonsLoaded = true;
	if (window.location.href.indexOf("?open_settings") != -1) {
		showSettings();
	}
}
var _commonsLoaded;
if (window.location.href.indexOf("forum.nationstates") == -1) {
	_commonsSetup();
	console.log("immediate setup");
} else {
	setTimeout(_commonsSetup, 250);
	console.log("delayed setup");
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
			} else if (isAntiquityTheme()) {
				var html = $("#main").html();
				$("#main").remove();
				$("<div id='main'><div id='wrap'>" + html + "</div></div>").insertAfter("#banner");
			}
			$("#main").html($("#main").html() + "<div id='nationstates_settings'><div>");
			$("#nationstates_settings").html(data);
			if (isAntiquityTheme() && !forums) {
				$("#nationstates_settings").css("margin-left", "0");
			}
			$("#nationstates_settings").hide();
			$("#nationstates_settings").find('input').each(function() {
				var setting = localStorage.getItem($(this).prop("id"));
				$(this).prop("checked", (setting == null || setting == "true"));
			});
			if (!$("#forum_enhancements").prop("checked")) {
				$("#forum_enhancements_form").find('input').toggleDisabled();
			}
			if (!$("#region_enhancements").prop("checked")) {
				$("#region_enhancements_form").find('input').toggleDisabled();
			}
			if (!$("#telegram_enhancements").prop("checked")) {
				$("#telegram_enhancements_form").find('input').toggleDisabled();
			}
			$("#region_enhancements").on('click', function() {
				$("#region_enhancements_form").find('input').toggleDisabled();
			});
			$("#forum_enhancements").on('click', function() {
				$("#forum_enhancements_form").find('input').toggleDisabled();
			});
			$("#telegram_enhancements").on('click', function() {
				$("#telegram_enhancements_form").find('input').toggleDisabled();
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

var _nation = "";

/*
	Returns the nation name of the active user, or empty string if no active user.
*/
function getUserNation() {
	return _nation;
}

var _region = "";

/*
	Returns the region name of the active user, or empty string if no active user.
*/
function getUserRegion() {
	return _region;
}

var _visibleNation = "";

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
function _setupVariables() {
	if (window.location.href.contains("region=")) {
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
	if ($(".STANDOUT:first").attr("href")) {
		_nation = $(".STANDOUT:first").attr("href").substring(7);
	}
	if ($(".STANDOUT:eq(1)").attr("href")) {
		_region = $(".STANDOUT:eq(1)").attr("href").substring(7);
	}
	if ($(".nationname > a").attr("href")) {
		_visibleNation = $(".nationname > a").attr("href").trim().substring(8);
	}
	$("#main").mousemove(function (c) {
		_lastPageActivity = (new Date()).getTime();
	});
};

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

function isSettingEnabled(setting) {
	return localStorage.getItem(setting) == null || localStorage.getItem(setting) == "true";
}

function isScrolledIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((docViewTop <= elemBottom) && (docViewBottom >= elemTop));
}
