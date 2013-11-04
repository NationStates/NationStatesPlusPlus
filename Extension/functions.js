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
})();

function doAuthorizedPostRequest(url, postData, success, failure) {
	getNSPPAPI().getUserDetails(function(nation, authCode) {
		var authToken = localStorage.getItem(nation + "-auth-token");
		postData = "nation=" + nation + "&auth=" + authCode + (authToken != null ? "&auth-token=" + authToken : "") + (postData.length > 0 ? "&" + postData : "");
		$.post(url, postData, function(data, textStatus, jqXHR) {
			var authToken = jqXHR.getResponseHeader("X-Auth-Token");
			if (authToken != null) {
				localStorage.setItem(nation + "-auth-token", authToken);
				if (typeof success != "undefined" && success != null) {
					success(data, textStatus, jqXHR);
				}
			}
		}).fail(function(data, textStatus, jqXHR) {
			if (typeof failure != "undefined" && failure != null) {
				failure(data, textStatus, jqXHR);
			}
		});
	});
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
		});
		_lastPageActivity = Date.now()
	}
	return _lastPageActivity;
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

function parseBBCodes(text) {
	text = $("<div></div>").html(text).text();
	text = text.replaceAll("[b]", "<b>").replaceAll("[/b]", "</b>");
	text = text.replaceAll("[i]", "<i>").replaceAll("[/i]", "</i>");
	text = text.replaceAll("[normal]", "<span style='font-size:14px'>").replaceAll("[/normal]", "</span>");
	text = text.replaceAll("[u]", "<u>").replaceAll("[/u]", "</u>");
	text = text.replaceAll("[blockquote]", "<blockquote class='news_quote'>").replaceAll("[/blockquote]", "</blockquote>");
	text = text.replaceAll("[list]", "<ul>").replaceAll("[/list]", "</ul>");
	text = text.replaceAll("[*]", "</li><li>");
	text = parseUrls(text);
	text = parseImages(text);
	text = updateTextLinks("nation", text);
	text = updateTextLinks("region", text);
	text = text.replaceAll("\n", "</br>");
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
		text = text.substring(0, index) + "<a target='_blank' href='http://nationstates.net/" + tag + "=" + innerText.toLowerCase().replaceAll(" ", "_") + "'>" + innerText + "</a>" + text.substring(endIndex + tag.length + 3);
		index = text.indexOf("[" + tag + "]", index);
	}
	return text;
}

function parseUrls(text) {
	var index = text.indexOf("[url=");
	while (index > -1) {
		var endIndex = text.indexOf("[/url]", index + 6);
		if (endIndex == -1) {
			break;
		}
		var innerText = text.substring(index + 5, endIndex + 1);
		var url = innerText.substring(0, innerText.indexOf("]"));
		
		text = text.substring(0, index) + "<a target='_blank' href='" + url + "'>" + innerText.substring(innerText.indexOf("]") + 1, innerText.length - 1) + "</a>" + text.substring(endIndex + 6);
		index = text.indexOf("[url=", index);
	}
	return text;
}

function parseImages(text) {
	var index = text.indexOf("[img]");
	while (index > -1) {
		var endIndex = text.indexOf("[/img]", index + 6);
		if (endIndex == -1) {
			break;
		}
		var url = text.substring(index + 5, endIndex);
		
		text = text.substring(0, index) + "<img class='center-img' src='" + url + "'>" + text.substring(endIndex + 6);
		index = text.indexOf("[img]", index);
	}
	return text;
}

function isScrolledIntoView(elem) {
	var docViewTop = $(window).scrollTop();
	var docViewBottom = docViewTop + $(window).height();

	var elemTop = $(elem).offset().top;
	var elemBottom = elemTop + $(elem).height();

	return ((docViewTop <= elemBottom) && (docViewBottom >= elemTop));
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