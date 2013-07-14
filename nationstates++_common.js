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
	console.log("End of setup: " + Date.now());
	if (window.location.href.indexOf("forum.nationstates") == -1) {
		setupSyncing();
	}
	update(1);
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
		$.get("http://capitalistparadise.com/nationstates/v1_8/" + (forums ? "forum_" : "region_") + "settings.html", function(data) {
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
				localStorage.setItem("settings-timestamp", Date.now());
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

var _progress_label
function setupSyncing() {
	var banner = $("#banner, #nsbanner");
	var progressStyle = "right: 250px; position: absolute; top: 6px; width: 150px; height: 16px; background: rgba(255, 255, 255, 0.65);";
	if (banner.children().length == 3) {
		$(banner).append("<div id='firebase_progress_bar' style='" + progressStyle + "' class='ns-settings' title='Syncing Settings...'><span id='progress_label' style='position: absolute; text-align: center; line-height: 1.5em; margin-left: 30px; font-size:10px; font-weight: bold;'>Syncing Settings</span></div>");
	} else {
		$(banner).append("<div id='firebase_progress_bar' style='" + progressStyle + "' class='ns-settings' title='Syncing Settings...'><span id='progress_label' style='position: absolute; text-align: center; line-height: 1.5em; margin-left: 30px; font-size:10px; font-weight: bold;'>Syncing Settings</span></div>");
	}
	$("#firebase_progress_bar" ).progressbar({value: 0});
	$("#firebase_progress_bar" ).hide();
	_progress_label = $("#firebase_progress_bar").find('#progress_label').clone().width($("#firebase_progress_bar").width());
	_progress_label.css("position", "relative");
	_progress_label.css("font-weight", "bold");
	_progress_label.css("color", "white");
	_progress_label.css("text-align", "left");
	_progress_label.css("display", "block");
	_progress_label.css("overflow", "hidden");
	_progress_label.css("width", "auto");
	$('.ui-progressbar-value').append(_progress_label);
	$('.ui-progressbar-value').css("background", "#425AFF");

	setTimeout(function() {
		console.log("checking " + getUserNation());
		if (getUserNation() != "") {
			$("#firebase_progress_bar" ).show();
			console.log("authing " + getUserNation());
			var authToken = localStorage.getItem("auth-" + getUserNation());
			if (authToken != null) {
				$("#firebase_progress_bar" ).progressbar({value: 40});
				loginFirebase(authToken);
			} else {
				$("#firebase_progress_bar" ).progressbar({value: 5});
				requestAuthToken();
			}
		}
	}, 1000);
}

function requestAuthToken() {
	$.get("http://www.nationstates.net/page=compose_telegram", function(data) {
		var check = $(data).find("input[name=chk]").val();
		$.post("/page=telegrams", 'chk=' + check + '&tgto=NationStatesPlusPlus&message=Verify+Nation.&send=1', function(data) {
			if (data.indexOf("To prevent spam") != -1) {
				console.log("Not Sent, re-sending");
				setTimeout(requestAuthToken, 2500);
			} else {
				console.log("sent auth tg");
				localStorage.setItem("auth-" + getUserNation() + "-time", Date.now());
				$("#firebase_progress_bar").progressbar({value: 25});
				checkTelegrams();
			}
		});
	});
}

var stopCheck = false;
function checkTelegrams() {
	if (stopCheck) {
		return;
	}
	$.get("/page=telegrams", function(data) {
		var value = $("#firebase_progress_bar").progressbar("option", "value");
		if (value < 50) {
			$("#firebase_progress_bar").progressbar({value: value + 5});
		} else if (value < 60) {
			$("#firebase_progress_bar").progressbar({value: value + 1});
		}
		$(data).find("#tglist").children().each(function() {
			var headers = $(this).find(".tg_headers");
			if (headers.length > 0) {
				var href = headers.find(".nlink").attr("href");
				if (typeof href != "undefined") {
					var nation = href.substring(7);
					if (nation == "nationstatesplusplus") {
						$("#firebase_progress_bar" ).progressbar({value: 60});
						var tgid = $(this).attr("id").substring(5);
						$.get("/page=tg/tgid=" + tgid, function(telegram) {
							$("#firebase_progress_bar" ).progressbar({value: 70});
							var authToken = $(telegram).find(".tgcontent").children("p").html();
							stopCheck = true;
							loginFirebase(authToken);
							//Delete tg now
							$.get("/page=compose_telegram", function(data) {
								var check = $(data).find("input[name=chk]").val();
								$.get("http://www.nationstates.net/page=ajax3/a=tgdelete/tgid=" + tgid + "/chk=" + check, function(data) {console.log("deleted");});
							});
						});
					}
				}
			}
		});
	});
	if (!stopCheck) {
		setTimeout(checkTelegrams, 2000);
	}
}

function loginFirebase(authToken) {
	console.log(authToken);
	$("#firebase_progress_bar" ).progressbar({value: 80});
	(new Firebase("https://nationstatesplusplus.firebaseio.com")).auth(authToken, function(error) {
		if(error) {
			console.log("Login Failed!", error);
			localStorage.removeItem("auth-" + getUserNation());
			$("#firebase_progress_bar" ).progressbar({value: 15});
			requestAuthToken();
		} else {
			_progress_label.html("Sync Successful!");
			$('#progress_label').hide();
			$("#firebase_progress_bar" ).progressbar({value: 100});
			setTimeout(function() {
				$("#firebase_progress_bar").animate({ width: 'toggle' }, 3000);
			}, 2000);
			console.log("Login Succeeded: " + Date.now());
			localStorage.setItem("auth-" + getUserNation(), authToken);
			syncFirebase();
		}
	});
}

function syncFirebase() {
	var settingsTime
	var dataRef = new Firebase("https://nationstatesplusplus.firebaseio.com/nation/" + getUserNation() + "/");
	dataRef.child("settings").child("settings_timestamp").on('value', function(snapshot) {
		var lastFirebaseUpdate = 0;
		if (snapshot.val() != null) {
			lastFirebaseUpdate = parseInt(snapshot.val());
		}
		var lastSettingsUpdate = 0;
		if (localStorage.getItem("settings-timestamp") != null) {
			lastSettingsUpdate = parseInt(localStorage.getItem("settings-timestamp"));
		}
		if (lastFirebaseUpdate < lastSettingsUpdate) {
			dataRef.child("settings").set({
				region_enhancements: isSettingEnabled("region_enhancements"),
				embassy_flags: isSettingEnabled("embassy_flags"),
				search_rmb: isSettingEnabled("search_rmb"),
				infinite_scroll: isSettingEnabled("infinite_scroll"),
				show_ignore: isSettingEnabled("show_ignore"),
				show_quote: isSettingEnabled("show_quote"),
				auto_update: isSettingEnabled("auto_update"),
				clickable_links: isSettingEnabled("clickable_links"),
				hide_ads: isSettingEnabled("hide_ads"),
				telegram_enhancements: isSettingEnabled("telegram_enhancements"),
				clickable_telegram_links: isSettingEnabled("clickable_telegram_links"),
				settings_timestamp: (localStorage.getItem("settings-timestamp") == null ? Date.now() : localStorage.getItem("settings-timestamp"))
			});
		} else {
			dataRef.child("settings").on('value', function(snapshot) {
				var settings = snapshot.val();
				for (var key in settings) {
					localStorage.setItem(key, settings[key]);
					console.log("Setting: " + key + " Value: " + settings[key]);
				}
			});
		}
	});
	for (var i = 0; i < localStorage.length; i++){
		var key = localStorage.key(i);
		if (key.startsWith("issue-") && key.contains(getUserNation())) {
			updateFirebaseIssue(key);
		}
	}
}

function updateFirebaseIssue(issueKey) {
	var split = issueKey.split("-");
	var choice = issueKey.substring(issueKey.indexOf("choice-") + "choice-".length);
	var issueRef = (new Firebase("https://nationstatesplusplus.firebaseio.com/nation/" + getUserNation() + "/")).child("issues").child(split[1]).child(choice);
	issueRef.on('value', function(snapshot) {
		console.log("issue/" + split[1] + "/" + choice + " | " + issueKey + " : " + localStorage.getItem(issueKey));
		var timestamps = snapshot.val();
		if (timestamps != null) {
			if (localStorage.getItem(issueKey) != timestamps) {
				var remoteTimestamps = timestamps.split(",");
				var localTimestamps = localStorage.getItem(issueKey).split(",");
				var mergedTimestamps = "";
				var json = new Object();
				for (var j = 0; j < remoteTimestamps.length; j++) {
					if (isNumber(remoteTimestamps[j])) {
						json[remoteTimestamps[j]] = true;
					}
				}
				console.log(json);
				for (var j = 0; j < localTimestamps.length; j++) {
					if (isNumber(localTimestamps[j])) {
						json[localTimestamps[j]] = true;
					}
				}
				console.log(json);
				for (var time in json) {
					if (mergedTimestamps.length > 0) {
						mergedTimestamps += ",";
					}
					mergedTimestamps += time;
				}
				console.log(json);
				console.log("Remote: " + remoteTimestamps);
				console.log("Local: " + localTimestamps);
				console.log("Merged: " + mergedTimestamps);
				localStorage.setItem(issueKey, mergedTimestamps);
			}
		}
		issueRef.set(localStorage.getItem(issueKey));
	});
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
	if ($(".STANDOUT:first").attr("href")) {
		_nation = $(".STANDOUT:first").attr("href").substring(7);
	} else {
		var nationSelector = $("a:contains('Logout'):last");
		if (typeof nationSelector.text() != 'undefined' && nationSelector.text().length > 0) {
			_nation = nationSelector.text().substring(9, nationSelector.text().length - 2);
		}
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

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
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

var _gaq = _gaq || [];
function update(delay){
	setTimeout(function() {
		_gaq.push(['_setAccount', 'UA-41267101-1']);
		_gaq.push(['_trackPageview']);
		_gaq.push(['_setCustomVar', 1, 'Version', 'v1.7', 2]);

		if (delay == 1) {
			if (getVisibleRegion() != "") _gaq.push(['_trackEvent', 'NationStates', 'Region', getVisibleRegion()]);
			if (getVisiblePage() != "") _gaq.push(['_trackEvent', 'NationStates', 'Page', getVisiblePage()]);
			if (getUserNation() != "") _gaq.push(['_trackEvent', 'NationStates', 'Home_Region', getUserNation()]);
			if (getUserRegion() != "") _gaq.push(['_trackEvent', 'NationStates', 'Nation', getUserRegion()]);
			_gaq.push(['_trackEvent', 'NationStates', 'URL', window.location.href]);
		}
		update(60000);
	}, delay);
}