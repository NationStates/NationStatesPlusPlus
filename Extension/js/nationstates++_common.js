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
	
	$.QueryString = (function(a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'))

	//Add string.startsWith
	if (typeof String.prototype.startsWith != 'function') {
		String.prototype.startsWith = function (str){
			return this.slice(0, str.length) == str;
		};
	}
	
	//Add string.endsWith
	if (typeof String.prototype.endsWith != 'function') {
		String.prototype.endsWith = function (s) {
			return this.length >= s.length && this.substr(this.length - s.length) == s;
		}
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
	
	if (typeof String.prototype.count != 'function') {
		String.prototype.count = function(substr,start,overlap) {
			overlap = overlap || false;
			start = start || 0;

			var count = 0, 
				offset = overlap ? 1 : substr.length;

			while((start = this.indexOf(substr, start) + offset) !== (offset - 1))
				++count;
			return count;
		};
	}

	//Add escape
	RegExp.escape = function(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	}

	//Add replaceAll
	String.prototype.replaceAll = function(search, replace) {
		return this.replace(new RegExp(RegExp.escape(search),'g'), replace);
	};

	(function ($) {
		$.fn.get_selection = function () {
			var e = this.get(0);
			//Mozilla and DOM 3.0
			if('selectionStart' in e) {
				var l = e.selectionEnd - e.selectionStart;
				return { start: e.selectionStart, end: e.selectionEnd, length: l, text: e.value.substr(e.selectionStart, l) };
			}
			else if(document.selection) {		//IE
				e.focus();
				var r = document.selection.createRange();
				var tr = e.createTextRange();
				var tr2 = tr.duplicate();
				tr2.moveToBookmark(r.getBookmark());
				tr.setEndPoint('EndToStart',tr2);
				if (r == null || tr == null) return { start: e.value.length, end: e.value.length, length: 0, text: '' };
				var text_part = r.text.replace(/[\r\n]/g,'.'); //for some reason IE doesn't always count the \n and \r in length
				var text_whole = e.value.replace(/[\r\n]/g,'.');
				var the_start = text_whole.indexOf(text_part,tr.text.length);
				return { start: the_start, end: the_start + text_part.length, length: text_part.length, text: r.text };
			}
			//Browser not supported
			else return { start: e.value.length, end: e.value.length, length: 0, text: '' };
		};

		$.fn.set_selection = function (start_pos,end_pos) {
			var e = this.get(0);
			//Mozilla and DOM 3.0
			if('selectionStart' in e) {
				e.focus();
				e.selectionStart = start_pos;
				e.selectionEnd = end_pos;
			}
			else if (document.selection) { //IE
				e.focus();
				var tr = e.createTextRange();

				//Fix IE from counting the newline characters as two seperate characters
				var stop_it = start_pos;
				for (i=0; i < stop_it; i++) if( e.value[i].search(/[\r\n]/) != -1 ) start_pos = start_pos - .5;
				stop_it = end_pos;
				for (i=0; i < stop_it; i++) if( e.value[i].search(/[\r\n]/) != -1 ) end_pos = end_pos - .5;

				tr.moveEnd('textedit',-1);
				tr.moveStart('character',start_pos);
				tr.moveEnd('character',end_pos - start_pos);
				tr.select();
			}
			return this.get_selection();
		};

		$.fn.replace_selection = function (replace_str) {
			var e = this.get(0);
			selection = this.get_selection();
			var start_pos = selection.start;
			var end_pos = start_pos + replace_str.length;
			e.value = e.value.substr(0, start_pos) + replace_str + e.value.substr(selection.end, e.value.length);
			this.set_selection(start_pos,end_pos);
			return {start: start_pos, end: end_pos, length: replace_str.length, text: replace_str};
		};

		$.fn.wrap_selection = function (left_str, right_str, sel_offset, sel_length) {
			var the_sel_text = this.get_selection().text;
			var selection = this.replace_selection(left_str + the_sel_text + right_str );
			if(sel_offset !== undefined && sel_length !== undefined) 
				selection = this.set_selection(selection.start +	sel_offset, selection.start +	sel_offset + sel_length);
			else if(the_sel_text == '') 
				selection = this.set_selection(selection.start + left_str.length, selection.start + left_str.length);
			return selection;
		};
	}(jQuery));

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
	$.fn.scrolled = function (waitTime, fn) {
		var tag = "scrollTimer";
		this.scroll(function () {
			var self = $(this);
			var timer = self.data(tag);
			if (timer) {
				clearTimeout(timer);
			}
			timer = setTimeout(function () {
				self.data(tag, null);
				fn();
			}, waitTime);
			self.data(tag, timer);
		});
	};
//*** END OF LICENSED CODE BY GAVEN KISTNER ***//


	if ($("#ns_setting").length == 0) {
		var bannerStyle = "position:absolute; top:0px; margin:6px 60px 0px 0px; z-index:98; font-weight:bold; color: white !important; font-weight: bold; font-size: 8pt; padding: 2px 8px 2px 8px; background: black; 	background-color: rgba(0,0,0,0.2); 	border-radius: 8px;";
		if (isDarkTheme()) {
			bannerStyle += "background: #2A2A2A; border: 1px solid #383838;"
		}

		if (window.location.href.indexOf("hideBanner=true") != -1) {
			$("#banner").hide();
		} else {
			var banner = $("#banner, #nsbanner");
			$(banner).append("<div id='ns_setting'><a href='//www.nationstates.net/page=blank?ns_settings=true' style='" + bannerStyle + " right: 78px;'>NS++ Settings</a></div>");
			if (window.location.href.indexOf('forum.nationstates.net/') == -1 ) {
				$(banner).append("<div id='puppet_setting' style='display:none;'><a href='javascript:void(0)' style='" + bannerStyle + " right: 188px;'>Puppets</a></div>");
			}
		}
	}
	if (getSettings().isEnabled("show_puppet_switcher")) {
		$("#puppet_setting").show();
		$("#puppet_setting").on("mouseover", function() { if ($("#puppet_setting_form:visible").length == 0) showPuppets(); });
	}
	if (getUserNation() == "glen-rhodes") {
		localStorage.setItem("ignore_theme_warning", true);
	}
	$("textarea, input[type='text'], td input[type='password'], input[name='region_name']").addClass("text-input");
})();

function isDarkTheme() {
	return $("link[href^='/ns.dark']").length > 0;
}

function getSettings(autoupdate) {
	autoupdate = autoupdate || false;
	var SettingsContainer = function() {
		var data = {};
		data.last_update = 0;
		data.settings = {};
		return data;
	}

	var api = {};
	api.autoupdate = autoupdate;
	api.refresh = function() {
		var data = null;
		try {
			data = localStorage.getItem("settings");
			data = data != null ? JSON.parse(data) : new SettingsContainer();
		} catch(err) {
			data = new SettingsContainer();
			console.log(err);
			console.log(JSON.stringify(localStorage.getItem("settings")));
			localStorage.removeItem("settings");
		}
		api.last_update = data.last_update;
		api.settings = data.settings;
	}
	api.refresh();

	api.getValue = function(option, defVal) {
		var value = this.settings[option];
		if (value == null) {
			if (typeof defVal != "undefined") {
				this.settings[option] = defVal;
				return defVal;
			}
			return null;
		}
		return value;
	}

	api.isEnabled = function(option, defVal) {
		var value = this.getValue(option, (typeof defVal == "undefined") ? true : defVal);
		return (typeof value === "string") ? ("true" === value) : value;
	}

	api.setValue = function(option, value) {
		if (value != null) {
			this.settings[option] = value;
		} else {
			delete this.settings[option];
		}
		if (this.autoupdate) {
			this.pushUpdate();
		}
	}

	api.update = function(callback) {
		var api = this;
		$.get("https://nationstatesplusplus.net/api/nation/latest_update/?name=" + getUserNation(), function(data, textStatus, xhr) {
			data = data || {}
			if (xhr.status != 204 && data.timestamp > api.last_update) {
				api.last_update = data.timestamp;
				$.get("https://nationstatesplusplus.net/api/nation/settings/?name=" + getUserNation(), function(data, textStatus, xhr) {
					api.settings = data;
					api.save();
					if (typeof callback != "undefined") callback(data, textStatus, xhr);
				}).fail(function(jqXHR, textStatus, errorThrown) {
					if (typeof callback != "undefined") callback(jqXHR, textStatus, errorThrown);
				});
			} else if (data.timestamp <= api.last_update) {
				api.pushUpdate(callback);
			} else {
				if (typeof callback != "undefined") callback();
			}
		});
	}

	api.save = function() {
		var data = {};
		data.settings = this.settings;
		data.last_update = this.last_update;
		localStorage.setItem("settings", JSON.stringify(data));
	}

	api.pushUpdate = function(callback) {
		this.save();
		var api = this;
		doAuthorizedPostRequest("https://nationstatesplusplus.net/api/nation/settings/", "settings=" + encodeURIComponent(JSON.stringify(this.settings)), function(data, textStatus, xhr) {
			api.last_update = Date.now();
			if (typeof callback != "undefined") callback(data, textStatus, xhr);
		});
	}

	return api;
}

function getUserData(autoupdate) {
	autoupdate = autoupdate || false;
	var DataContainer = function() {
		var data = {};
		data.last_update = 0;
		data.userData = {};
		return data;
	}

	var api = {};
	api.autoupdate = autoupdate;
	api.refresh = function() {
		var data = null;
		try {
			data = localStorage.getItem(getUserNation() + "-data");
			data = data != null ? JSON.parse(data) : new DataContainer();
		} catch(err) {
			data = new DataContainer();
			console.log(err);
			console.log(JSON.stringify(localStorage.getItem(getUserNation() + "-data")));
			localStorage.removeItem(getUserNation() + "-data");
		}
		api.last_update = data.last_update;
		api.userData = data.userData;
	}
	api.refresh();

	api.getValue = function(option, defVal) {
		var value = this.userData[option];
		if (value == null) {
			if (typeof defVal != "undefined") {
				this.userData[option] = defVal;
				return defVal;
			}
			return null;
		}
		return value;
	}

	api.setValue = function(option, value) {
		if (value != null) {
			this.userData[option] = value;
		} else {
			delete this.userData[option];
		}
		if (this.autoupdate) {
			this.save();
		}
	}

	api.update = function(callback) {
		var api = this;
		$.get("https://nationstatesplusplus.net/api/nation/data/?name=" + getUserNation(), function(data, textStatus, xhr) {
			data = data || {}
			if (xhr.status != 204 && data.timestamp > api.last_update) {
				api.last_update = data.timestamp;
				doAuthorizedPostRequest("https://nationstatesplusplus.net/api/nation/data/get/", "", function(data) {
					api.userData = data;
					api.save();
					if (typeof callback != "undefined") callback();
				});
			} else if (data.timestamp <= api.last_update) {
				api.pushUpdate(callback);
			} else {
				if (typeof callback != "undefined") callback();
			}
		});
	}

	api.save = function() {
		var data = {};
		data.userData = this.userData;
		data.last_update = this.last_update;
		localStorage.setItem(getUserNation() + "-data", JSON.stringify(data));
	}

	api.pushUpdate = function(callback) {
		this.last_update = Date.now();
		this.save();
		doAuthorizedPostRequest("https://nationstatesplusplus.net/api/nation/data/set/", "data=" + encodeURIComponent(JSON.stringify(this.userData)), callback);
	}

	return api;
}

/**
	Converts a search input into an array of keywords to search for.
	Each word separated by one or more spaces is considered a keyword,
	Unless the text is inside a pair of ""'s.
*/
function searchToKeywords(search) {
	var keys = new Array();
	var start = 0;
	var foundQuote = false;
	for (var i = 0, len = search.length; i < len; i++) {
		if (search[i] == '"') {
			if (!foundQuote) {
				foundQuote = true;
			} else {
				foundQuote = false;
				keys.push(search.substring(start + 1, i).trim());
				start = i + 1;
			}
		} else if (search[i] == " " && !foundQuote) {
			if (i != start) {
				keys.push(search.substring(start, i).trim());
			}
			start = i + 1;
		}
	}
	var lastKey;
	if (foundQuote) {
		lastKey = search.substring(start + 1).trim();
	} else {
		lastKey = search.substring(start).trim();
	}
	if (lastKey.length > 0) {
		keys.push(lastKey);
	}
	return keys;
}

function showPuppets() {
	if (!getSettings().isEnabled("show_puppet_switcher")) {
		return;
	}
	if ($("#puppet_setting_form").length == 0) {
		$("#puppet_setting").append("<div id='puppet_setting_form' class='puppet-form'></div>");
		$("#puppet_setting_form").hover(function() { $("#puppet_setting_form").css('display', 'block').css('opacity', '.75'); }, function() { $("#puppet_setting_form").css('display', 'none'); });
	}
	$("#puppet_setting_form").css('opacity', '.75').show();
	var html = "<h3>Puppets</h3><ul>";
	var puppets = localStorage.getItem("puppets");
	if (puppets == null) puppets = "";
	var split = puppets.split(",");
	var numPuppets = 0;
	for (var i = 0; i < split.length; i++) {
		var name = split[i];
		if (name.length > 0) {
			var cache = getPuppetCache(name);
			var region = cache.region;
			html += "<li><div class='puppet-form-inner' style='margin-bottom: -15px;'><p style='margin-top: 3px;'><a class='puppet-name' id='" + name + "' href='/nation=" + name + "' style='color: white;'>" + name.split("_").join(" ").toTitleCase() + "</a>" + (cache.wa == "true" ? "<span style='color:green'> (WA) </span>" : "") + "</p><ul style='display:none;'><li id='puppet-region-" + name + "'>(<a style='color: white;' href='/region=" + region + "'>" + region.split("_").join(" ").toTitleCase() + "</a>)</li></ul></div><img name='" + name + "' class='puppet-form-remove' src='https://nationstatesplusplus.net/nationstates/static/remove.png'></img></li>";
			numPuppets++;
		}
	}
	if (numPuppets == 0) {
		html += "<li>There's nothing here...</li>";
	}
	html += "</ul>";
	html += "<p style='margin-top: -20px; margin-bottom: 1px;'><input class='text-input' type='text' id='puppet_nation' size='18' placeholder='Nation'></p>";
	html += "<p style='margin-top: 1px;'><input class='text-input' type='password' id='puppet_password' size='18' placeholder='Password'></p>";
	html += "<div id='puppet_invalid_login' style='display:none;'><p>Invalid Login</p></div><p class='puppet_creator'><a style='color:white;' href='//www.nationstates.net/page=blank?puppet_creator'>Create New Puppet Nations</a></p>";

	$("#puppet_setting_form").html(html);
	
	$("#puppet_nation, #puppet_password").on("keydown", function(event) {
		if (event.keyCode == 13) {
			addPuppet();
		}
	});
	$("a.puppet-name").on("mouseenter", function() { 
		if (getSettings().isEnabled("show-region-on-hover")) {
			if (!$("#puppet-region-" + $(this).attr("id")).parent().is(":visible")) {
				$("#puppet-region-" + $(this).attr("id")).parent().animate({ height: 'toggle' }, 500);
			}
		}
	});
	$(".puppet-form-remove").on("click", function() { console.log("remove"); console.log($(this).attr("name")); removePuppet($(this).attr("name")); });
	$("a.puppet-name").on("click", function(event) {
		switchToPuppet($(this).attr("id"));
		event.preventDefault();
	});
}

function getPuppetCache(name) {
	var cache = localStorage.getItem("puppet-" + name + "-cache");
	localStorage.removeItem("puppet-" + name + "-region");
	if (cache != null) {
		cache = JSON.parse(cache);
		if (cache.timestamp > Date.now()) {
			return cache;
		}
	}
	$.get("/nation=" + name, function(data) {
		if (typeof $(data).find(".rlink:first").attr('href') != "undefined") {
			var region = $(data).find(".rlink:first").attr('href').substring(7);
			$("#puppet-region-" + name).html("(<a style='color: white;' href='/region=" + region + "'>" + region.split("_").join(" ").toTitleCase() + "</a>)");
			var cache = {}
			cache.region = region;
			cache.wa = $(data).find(".wa_status").length > 0 ? "true" : "false";
			cache.timestamp = (Date.now() + 60 * 60 * 1000);
			localStorage.setItem("puppet-" + name + "-cache", JSON.stringify(cache));
		}
	});
	var cache = new Object();
	cache.region = "UNKNOWN REGION";
	cache.wa = false;
	return cache;
}

function switchToPuppet(name) {
	localStorage.removeItem("puppet-" + name + "-region");
	$.post("//www.nationstates.net/", "logging_in=1&nation=" + encodeURIComponent(name) + "&password=" + encodeURIComponent(localStorage.getItem("puppet-" + name)) + (getSettings().isEnabled("autologin-puppets", false) ?"&autologin=yes" : ""), function(data) {
		if (data.contains("Would you like to restore it?")) {
			$("#content").html($(data).find("#content").html());
		} else {
			if (getSettings().isEnabled("redirect-puppet-page")) {
				window.location.href = "/nation=" + name;
			} else {
				window.location.reload(false);
			}
		}
	});
}

function removePuppet(name) {
	var puppets = localStorage.getItem("puppets");
	if (puppets == null) puppets = "";
	var split = puppets.split(",");
	var newPuppets = "";
	for (var i = 0; i < split.length; i++) {
		if (split[i] != name && split[i].length > 0) {
			if (newPuppets.length > 0) {
				newPuppets += ",";
			}
			newPuppets += split[i];
		}
	}
	localStorage.setItem("puppets", newPuppets);
	localStorage.removeItem("puppet-" + name);
	showPuppets();
}

function addPuppet() {
	var nationName = $("#puppet_nation");
	var nationPassword = $("#puppet_password");
	if (nationName.val() == "" || nationPassword.val() == "") {
		$("#puppet_invalid_login").show();
		return;
	}
	var formattedName = nationName.val().toLowerCase().split(" ").join("_");
	addPuppetNation(formattedName, nationPassword.val());
	showPuppets();
	$("#puppet_nation").focus();
}

function addPuppetNation(nation, password) {
	localStorage.setItem("puppet-" + nation, password);
	var puppets = localStorage.getItem("puppets");
	if (puppets == null) puppets = "";
	var split = puppets.split(",");
	var found = false;
	for (var i = 0; i < split.length; i++) {
		if (split[i] == nation) {
			found = true;
			break;
		}
	}
	if (!found) {
		if (puppets.length != 0) {
			puppets += ",";
		}
		localStorage.setItem("puppets", puppets + nation);
	}
}

function getNationStatesAuth(callback) {
	$.get("//www.nationstates.net/page=verify_login", function(data) {
		//Prevent image requests by replacing src attribute with data-src
		var authCode = $(data.replace(/[ ]src=/gim," data-src=")).find("#proof_of_login_checksum").html();
		//Regenerate localid if nessecary
		$(window).trigger("page/update");
		callback(authCode);
	});
}

function doAuthorizedPostRequest(url, postData, success, failure) {
	doAuthorizedPostRequestFor(getUserNation(), url, postData, success, failure);
}

function doAuthorizedPostRequestFor(nation, url, postData, success, failure) {
	var authToken = localStorage.getItem(nation + "-auth-token");
	//Check out NS++ auth token to see if it good enough first, avoid making a page=verify request
	if (authToken != null) {
		$.post("https://nationstatesplusplus.net/api/nation/auth/", "nation=" + nation + "&auth-token=" + encodeURIComponent(authToken), function(data, textStatus, jqXHR) {
			console.log("Auth token up to date");
			localStorage.setItem(nation + "-auth-token", data.code);
			doAuthorizedPostRequestInternal(nation, url, postData, success, failure);
		}).fail(function() {
			localStorage.removeItem(nation + "-auth-token");
			//Repeat request, get valid auth token
			console.log("Auth token out of date");
			doAuthorizedPostRequestFor(nation, url, postData, success, failure);
		});
	} else {
		getNationStatesAuth(function(authCode) {
			console.log("Getting auth token");
			$.post("https://nationstatesplusplus.net/api/nation/auth/", "nation=" + nation + "&auth=" + encodeURIComponent(authCode), function(data, textStatus, jqXHR) {
				localStorage.setItem(nation + "-auth-token", data.code);
			}).always(function() {
				doAuthorizedPostRequestInternal(nation, url, postData, success, failure);
			});
		});
	}
}

function doAuthorizedPostRequestInternal(nation, url, postData, success, failure) {
	var authToken = localStorage.getItem(nation + "-auth-token");
	postData = "nation=" + nation + (authToken != null ? "&auth-token=" + authToken : "") + (postData.length > 0 ? "&" + postData : "");
	$.post(url, postData, function(data, textStatus, jqXHR) {
		var authToken = jqXHR.getResponseHeader("X-Auth-Token");
		if (authToken != null) {
			localStorage.setItem(nation + "-auth-token", authToken);
		}
		if (typeof success != "undefined" && success != null) {
			success(data, textStatus, jqXHR);
		}
	}).fail(function(data, textStatus, jqXHR) {
		if (typeof failure != "undefined" && failure != null) {
			failure(data, textStatus, jqXHR);
		}
	});
}

/*
	Returns the nation name of the active user, or empty string if no active user.
*/
function getUserNation() {
	if ($(".STANDOUT:first").attr("href")) {
		return $(".STANDOUT:first").attr("href").substring(7);
	} else {
		var nationSelector = $("a:contains('Logout'):last");
		if (typeof nationSelector.text() != 'undefined' && nationSelector.text().length > 0) {
			return nationSelector.text().substring(9, nationSelector.text().length - 2).replaceAll(" ", "_").toLowerCase();
		}
	}
	return "";
}

/*
	Returns the region name of the active user, or empty string if no active user.
*/
function getUserRegion() {
	return $(".STANDOUT:eq(1)").attr("href") ? $(".STANDOUT:eq(1)").attr("href").substring(7) : "";
}

/*
	Returns the name of the nation the user is currently viewing, or empty string if none.
*/
function getVisibleNation() {
	return $(".nationname > a").attr("href") ? $(".nationname > a").attr("href").trim().substring(8) : "";
}

/*
	Returns the dilemma id number on the page, if any
*/
function getVisibleDilemma() {
	var split = window.location.href.split(/[/#/?]/);
	for (var i = 0; i < split.length; i++) {
		if (split[i].startsWith("dilemma=")) {
			return split[i].substring(8);
		}
	}
	return "";
}

/*
	Returns the sorting parameter on the page, if any
*/
function getVisibleSorting() {
	var split = window.location.href.split(/[/#/?]/);
	for (var i = 0; i < split.length; i++) {
		if (split[i].startsWith("sort=")) {
			return split[i].substring(5);
		}
	}
	return "";
}

/*
	Returns the region the user is currently viewing, or empty string if no region is visible.
*/
function getVisibleRegion() {
	var split = window.location.href.split(/[/#/?]/);
	for (var i = 0; i < split.length; i++) {
		if (split[i].startsWith("region=")) {
			return split[i].substring(7).toLowerCase().replaceAll(" ", "_");
		}
	}
	return "";
}

/*
	Returns the visible page the user is viewing.
*/
function getVisiblePage() {
	var split = window.location.href.split(/[/#/?]/);
	for (var i = 0; i < split.length; i++) {
		if (split[i].startsWith("page=")) {
			return split[i].substring(5);
		}
	}
	if (window.location.href.contains("/nation=")) {
		return "nation";
	}
	if (window.location.href.contains("/region=")) {
		return "region";
	}
	return "unknown";
}

function getTelegramFolder() {
	var split = window.location.href.split(/[/#/?]/);
	for (var i = 0; i < split.length; i++) {
		if (split[i].startsWith("folder=")) {
			return split[i].substring(7);
		}
	}
	return "inbox";
}

function getVisibleTag() {
	var split = window.location.href.split(/[/#/?]/);
	for (var i = 0; i < split.length; i++) {
		if (split[i].startsWith("tag=")) {
			return split[i].substring(4);
		}
	}
	return "";
}

function getTelegramStart() {
	var split = window.location.href.split(/[/#/?]/);
	for (var i = 0; i < split.length; i++) {
		if (split[i].startsWith("start=")) {
			return split[i].substring(6);
		}
	}
	return "0";
}


function getPageDetail() {
	var split = window.location.href.split(/[/#/?]/);
	for (var i = 0; i < split.length; i++) {
		if (split[i].startsWith("detail=")) {
			return split[i].substring(7);
		}
	}
	return "";
}

var _isPageActive;
window.onfocus = function () { 
	_isPageActive = true; 
	_lastPageActivity = Date.now()
}; 

window.onblur = function () { 
	_isPageActive = false; 
};

function isPageActive() {
	return _isPageActive;
}

var _lastPageActivity;
function getLastActivity() {
	if (!_lastPageActivity) {
		$("#main").mousemove(function (c) {
			_lastPageActivity = Date.now();
			console.log("Mouse Move");
		}).mousedown(function (c) {
			_lastPageActivity = Date.now();
			console.log("Mouse Down");
		}).mouseup(function (c) {
			_lastPageActivity = Date.now();
			console.log("Mouse Up");
		});
		_lastPageActivity = Date.now()
	}
	return _lastPageActivity;
}

var _isAntiquityTheme = document.head.innerHTML.indexOf("antiquity") != -1;
function isAntiquityTheme() {
	return _isAntiquityTheme;
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function parseBBCodes(text) {
	text = $("<div></div>").html(text).text();
	text = text.replaceAll("[b]", "<b>").replaceAll("[/b]", "</b>");
	text = text.replaceAll("[B]", "<b>").replaceAll("[/B]", "</b>");
	text = text.replaceAll("[i]", "<i>").replaceAll("[/i]", "</i>");
	text = text.replaceAll("[I]", "<i>").replaceAll("[/I]", "</i>");
	text = text.replaceAll("[normal]", "<span style='font-size:14px'>").replaceAll("[/normal]", "</span>");
	text = text.replaceAll("[u]", "<u>").replaceAll("[/u]", "</u>");
	text = text.replaceAll("[U]", "<u>").replaceAll("[/U]", "</u>");
	text = text.replaceAll("[blockquote]", "<blockquote class='news_quote'>").replaceAll("[/blockquote]", "</blockquote>");
	text = text.replaceAll("[list]", "<ul>").replaceAll("[/list]", "</ul>");
	text = text.replaceAll("[*]", "</li><li>");
	text = parseUrls(text, true);
	text = parseUrls(text, false);
	text = parseImages(text, true);
	text = parseImages(text, false);
	text = updateTextLinks("nation", text);
	text = updateTextLinks("region", text);
	text = text.replaceAll("\n", "</br>");
	
	//Strip align tags
	var regex = new RegExp("\\[align=.{0,}\\]", "gi");
	text.replace(regex, " ");
	regex = new RegExp("\\[/align\\]", "gi");
	text.replace(regex, " ");

	return text;
}

function updateTextLinks(tag, text) {
	var index = text.indexOf("[" + tag + "]");
	while (index > -1) {
		var endIndex = text.indexOf("[/" + tag + "]", index + tag.length + 2);
		if (endIndex == -1) {
			break;
		}
		var innerText = text.substring(index + tag.length + 2, endIndex);
		text = text.substring(0, index) + "<a target='_blank' href='/" + tag + "=" + innerText.toLowerCase().replaceAll(" ", "_") + "'>" + innerText + "</a>" + text.substring(endIndex + tag.length + 3);
		index = text.indexOf("[" + tag + "]", index);
	}
	return text;
}

function parseUrls(text, lowercase) {
	var index = text.indexOf((lowercase ? "[url=" : "[URL="));
	while (index > -1) {
		var endIndex = text.indexOf((lowercase ? "[/url]" : "[/URL]"), index + 6);
		if (endIndex == -1) {
			break;
		}
		var innerText = text.substring(index + 5, endIndex + 1);
		var url = innerText.substring(0, innerText.indexOf("]"));
		
		text = text.substring(0, index) + "<a target='_blank' href='" + url + "'>" + innerText.substring(innerText.indexOf("]") + 1, innerText.length - 1) + "</a>" + text.substring(endIndex + 6);
		index = text.indexOf((lowercase ? "[url=" : "[URL="), index);
	}
	return text;
}

function parseImages(text, lowercase) {
	var index = text.indexOf((lowercase ? "[img]" : "[IMG]"));
	while (index > -1) {
		var endIndex = text.indexOf((lowercase ? "[/img]" : "[/IMG]"), index + 6);
		if (endIndex == -1) {
			break;
		}
		var url = text.substring(index + 5, endIndex);
		
		text = text.substring(0, index) + "<img class='center-img' src='" + url + "'>" + text.substring(endIndex + 6);
		index = text.indexOf((lowercase ? "[img]" : "[IMG]"), index);
	}
	return text;
}
	
function addFormattingButtons() {
	$(".nscodedesc").find("abbr").each(function() {
		var text = $(this).html().substring(1, $(this).html().length - 1);
		$(this).html(text);
		if (text.length > 1) {
			$(this).css("width", "53px");
		} else {
			$(this).css("width", "23px");
		}
		if (text == "b") {
			$(this).attr("name", "formatting_button");
			$(this).css("font-weight", "bold");
			$(this).html(text.toUpperCase());
		} else if ($(this).html() == "i") {
			$(this).attr("name", "formatting_button");
			$(this).css("font-style", "italic");
		} else if ($(this).html() == "u") {
			$(this).attr("name", "formatting_button");
			$(this).css("text-decoration", "underline");
		} else if ($(this).html() == "nation") {
			$(this).attr("name", "formatting_button");
		} else if ($(this).html() == "region") {
			$(this).attr("name", "formatting_button");
		} else if ($(this).html() == "color") {
			$(this).attr("name", "formatting_button");
		} else if ($(this).html() == "url") {
			$(this).attr("name", "formatting_button");
		}

		$(this).attr("class", "forum_bbcode_button");
		$(this).changeElementType("button");
	});
	var formatBBCode = function(event) {
		event.preventDefault();
		var widebox = $(this).parent().prev();
		var value = ($(this).html().contains("<option>") ? $(this).val() : $(this).html());
		widebox.find("textarea[name='message']").wrap_selection("[" + value + "]", "[/" + value.split("=")[0] + "]");
	}
	$('body').on('click', "button[name='formatting_button']", formatBBCode);
}


function linkify(inputText, checkNationStates) {
	var replacedText, replacePattern1, replacePattern2, replacePattern3;
	
	if (typeof checkNationStates == "undefined" || checkNationStates) {
		if (inputText.indexOf("nationstates.net/") > -1) {
			return inputText;
		}
	}

	//URLs starting with http://, https://, or ftp://
	replacePattern1 = /(\b(https|http|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

	//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
	replacePattern2 = /(^|[^\/])(www\.[-A-Za-z0-9+&@#\/%?=~_()|!:,.;]*[-A-Za-z0-9+&@#\/%=~_()|])/gim;
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

function getNationAlias(nation) {
	if (localStorage.getItem("aliases-" + getUserNation()) != null && getUserNation() != "") {
		try {
			var aliases = JSON.parse(localStorage.getItem("aliases-" + getUserNation()));
			return aliases[nation];
		} catch (error) {
			console.log("Unable to retrieve aliases!");
			console.log(error);
		}
	}
	return null;
}

function setNationAlias(nation, alias) {
	if (getUserNation() != "") {
		var aliases = new Object();
		if (localStorage.getItem("aliases-" + getUserNation()) != null) {
			try {
				aliases = JSON.parse(localStorage.getItem("aliases-" + getUserNation()));
			} catch (error) {
				console.log("Unable to parse aliases!");
				console.log(error);
			}
		}
		if (alias != null) {
			aliases[nation] = alias;
		} else {
			delete aliases[nation];
		}
		localStorage.setItem("aliases-" + getUserNation(), JSON.stringify(aliases));
	}
}

function getNationStatesAPI() {
	var api = {};

	var reachedRateLimit = false;
	api.canUseAPI = function() {
		return getSettings().isEnabled("use_nationstates_api") && !reachedRateLimit;
	};
	var doRequestInternal = function(url, result) {
		if (result == null) {
			result = {};
		}
		var requests = localStorage.getItem("api_requests");
		if (requests == null) {
			requests = new Object();
		} else {
			try {
				requests = JSON.parse(requests);
			} catch (error) {
				numRequests = 50;
				localStorage.removeItem("api_requests");
				requests = new Object();
			}
		}
		var numRequests = 0;
		var oldest = Date.now();
		for (var time in requests) {
			var num = requests[time];
			if (time > Date.now() - 30000) {
				numRequests += num;
				oldest = Math.min(oldest, time);
			} else {
				delete requests[time];
			}
		}
		result.done = function(callback) {
			result._done = callback;
			return result;
		}
		result.fail = function(callback) {
			result._fail = callback;
			return result;
		}
		result.always = function(callback) {
			result._always = callback;
			return result;
		}
		if (numRequests >= 49) {
			setTimeout(doRequestInternal(url, result),	30001);
		} else {
			var num = requests["" + Date.now()];
			requests["" + Date.now()] = (num != null ? num + 1 : 1);
			var call = $.ajax({url: url, type: 'GET', dataType: "text"});
			if (typeof result["_done"] !== "undefined") {
				call.done(result["_done"]);
			}
			if (typeof result["_fail"] !== "undefined") {
				call.fail(result["_fail"]);
			}
			if (typeof result["_always"] !== "undefined") {
				call.always(result["_always"]);
			}
			result.done = function(callback) {
				call.done(callback);
				return result;
			}
			result.fail = function(callback) {
				call.fail(callback);
				return result;
			}
			result.always = function(callback) {
				call.always(callback);
				return result;
			}
		}
		localStorage.setItem("api_requests", JSON.stringify(requests));
		return result;
	};
	api.doRequest = function(url) {
		return doRequestInternal(url, null);
	};

	return api;
}

function timestampToTimeAgo(timestamp) {
	var threeDays = false;
	var time = "";
	var timeDiff = Date.now() - timestamp;
	if (timeDiff > 365 * 24 * 60 * 60 * 1000) {
		var years = Math.floor(timeDiff / (365 * 24 * 60 * 60 * 1000));
		if (years > 1) time += years + " years ";
		else time += "1 year ";
		timeDiff -= years * (365 * 24 * 60 * 60 * 1000);
	}
	if (timeDiff > 24 * 60 * 60 * 1000) {
		var days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
		threeDays = days > 3;
		if (days > 1) time += days + " days ";
		else time += "1 day ";
		timeDiff -= days * (24 * 60 * 60 * 1000);
	}
	if (!time.contains("year") && (!time.contains("days") || !threeDays) && timeDiff > 60 * 60 * 1000) {
		var hours = Math.floor(timeDiff / (60 * 60 * 1000));
		if (hours > 1) {
			time += hours + " hours ";
			timeDiff -= hours * (60 * 60 * 1000);
		}
	}
	if (!time.contains("year") && !time.contains("day") && !time.contains("hours") && timeDiff > 60 * 1000) {
		var minutes = Math.floor(timeDiff / (60 * 1000));
		if (minutes > 1) time += minutes + " minutes ";
		else time += "1 minutes ";
		timeDiff -= minutes * (60 * 1000);
	}
	if (!time.contains("year") && !time.contains("day") && !time.contains("hours") && !time.contains("minutes") && timeDiff > 1000) {
		time = "Seconds ";
	}
	time = time.substring(0, time.length - 1);
	return time;
}