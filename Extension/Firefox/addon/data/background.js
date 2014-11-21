//Minified js taken from /unminified-js and minified by http://jscompress.com/

$.nspp = "2.4.4";

var googleAnalytics = 'function update(e){setTimeout(function(){_gaq.push(["_setAccount","UA-41267101-1"]);_gaq.push(["_trackPageview"]);_gaq.push(["_setCustomVar",1,"Version","v' + $.nspp + '",2]);if(e==1){_gaq.push(["_trackEvent","NationStates","URL",window.location.href])}update(6e4)},e)}var _gaq=_gaq||[];update(1)';

var highchartsAdapter = '(function(){function e(){var e=window.location.href.split(/[/#/?]/);for(var t=0;t<e.length;t++){if(e[t].startsWith("region=")){return e[t].substring(7).toLowerCase().split(" ").join("_")}}return""}function t(){return $("link[href^=\'/ns.dark\']").length>0}function n(){return $(".nationname > a").attr("href")?$(".nationname > a").attr("href").trim().substring(8):""}function r(){if($("#highcharts_graph").length>0){chart={};chart.type=$("#highcharts_graph").attr("graph");chart.region=$("#highcharts_graph").attr("region");chart.title=$("#highcharts_graph").attr("title");chart.width=$("#highcharts_graph").attr("width");chart.height=$("#highcharts_graph").attr("height");chart.visibleNation=$("#highcharts_graph").attr("visible_nation");chart.showInfluence=$("#highcharts_graph").attr("show_influence")=="true";$("#highcharts_graph").remove();if(chart.type=="region_chart"&&e()==chart.region){u(chart.region,chart.title)}else if(chart.type=="set_chart_size"){o(chart.width,chart.height)}else if(chart.type=="national_power"&&n()==chart.visibleNation){s(chart.region,chart.title,chart.visibleNation,chart.showInfluence)}}if($("div[name=\'save_file\']").length>0){$("div[name=\'save_file\']").each(function(){console.log("Attempting to save: "+$(this).attr("file"));var e=$(this).html();var t=JSON.parse(e);var n=new Blob(t,{type:"text/plain;charset=utf-8"});saveAs(n,$(this).attr("file"));$(this).remove()})}setTimeout(r,100)}function s(e,n,r,s){$.get("https://nationstatesplusplus.net/api/region/wa/?region="+e,function(e){var o=[];var u=[];var a=[];var f=-1;for(var l in e){o.push(l)}if(s){var c=function(t,n){return e[n].influence-e[t].influence};o.sort(c)}else{var c=function(t,n){return e[n].endorsements-e[t].endorsements};o.sort(c)}for(var h=0;h<o.length;h++){var l=e[o[h]];u.push(l.endorsements);a.push(l.influence);if(f==-1&&o[h].toLowerCase().split(" ").join("_")==r){f=h}o[h]="<b>"+o[h]+"</b>"}if(i!=null){i.destroy()}var p;if(s){p=[{name:"Influence",data:a,color:"#AA4643"},{name:"Endorsements",data:u,color:"#4572A7"}]}else{p=[{name:"Endorsements",data:u,color:"#4572A7"}]}var d=$("<div>");chart=new Highcharts.Chart({chart:{type:"bar",renderTo:d[0],width:$("#"+(s?"influence":"power")).width(),height:Math.max(300,100+o.length*26*(s?2:1)),backgroundColor:"rgba(255, 255, 255, "+(t()?"0.1":"1.0")+")"},title:{text:"World Assembly Endorsements",color:t()?"#D0D0D0":"#000000"},subtitle:{text:"Region: "+n,color:t()?"#D0D0D0":"#000000"},xAxis:{categories:o,title:{text:null}},yAxis:{min:0,title:{text:"Endorsements",align:"high"},labels:{overflow:"justify",useHTML:true}},plotOptions:{bar:{dataLabels:{enabled:true},animation:false},series:{cursor:"pointer",point:{events:{click:function(){var e=this.category.substring(3,this.category.length-4);var t=window.location.href.startsWith("https://")?"https:":"http:";window.location.href=t+"//www.nationstates.net/nation="+e.toLowerCase().split(" ").join("_")+"/detail=wa_stats/stats="+(s?"influence":"power")}}}}},credits:{enabled:false},series:p});i=chart;if(f>-1){for(var h=0;h<chart.series.length;h++){chart.series[h].data[f].update({color:"#FF0000"})}}setTimeout(function(){$("#snark").remove();d.appendTo($("#"+(s?"influence":"power")))},500)})}function o(e,t){for(var n=0;n<Highcharts.charts.length;n++){if(Highcharts.charts[n]!=null)Highcharts.charts[n].setSize(e,t,true)}}function u(e,n){$.get("https://nationstatesplusplus.net/api/region/population/?region="+e,function(e){var r=[];for(var i=e.region.length-1;i>=0;i--){var s=[];s.push(e.region[i].timestamp);s.push(e.region[i].population);r.push(s)}chart=new Highcharts.Chart({chart:{type:"line",renderTo:"regional-pop",backgroundColor:"rgba(255, 255, 255, "+(t()?"0.1":"1.0")+")"},title:{text:"Regional Population",color:t()?"#D0D0D0":"#000000"},subtitle:{text:n,color:t()?"#D0D0D0":"#000000"},xAxis:{dateTimeLabelFormats:{month:"%e. %b",year:"%b"},type:"datetime",title:{text:null}},yAxis:{min:0,title:{text:"Population",align:"high"},labels:{overflow:"justify",useHTML:true}},credits:{enabled:false},series:[{name:"Population",data:r,color:"#4572A7"}]})})}String.prototype.startsWith=function(e){return this.slice(0,e.length)==e};r();var i=null})()';

var fileSaverjs = 'var saveAs=saveAs||typeof navigator!=="undefined"&&navigator.msSaveOrOpenBlob&&navigator.msSaveOrOpenBlob.bind(navigator)||function(e){var t=e.document,n=function(){return e.URL||e.webkitURL||e},r=e.URL||e.webkitURL||e,i=t.createElementNS("http://www.w3.org/1999/xhtml","a"),s=!e.externalHost&&"download"in i,o=function(n){var r=t.createEvent("MouseEvents");r.initMouseEvent("click",true,false,e,0,0,0,0,0,false,false,false,false,0,null);n.dispatchEvent(r)},u=e.webkitRequestFileSystem,a=e.requestFileSystem||u||e.mozRequestFileSystem,f=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},l="application/octet-stream",c=0,h=[],p=function(){var e=h.length;while(e--){var t=h[e];if(typeof t==="string"){r.revokeObjectURL(t)}else{t.remove()}}h.length=0},d=function(e,t,n){t=[].concat(t);var r=t.length;while(r--){var i=e["on"+t[r]];if(typeof i==="function"){try{i.call(e,n||e)}catch(s){f(s)}}}},v=function(r,o){var f=this,p=r.type,v=false,m,g,y=function(){var e=n().createObjectURL(r);h.push(e);return e},b=function(){d(f,"writestart progress write writeend".split(" "))},w=function(){if(v||!m){m=y(r)}if(g){g.location.href=m}else{window.open(m,"_blank")}f.readyState=f.DONE;b()},E=function(e){return function(){if(f.readyState!==f.DONE){return e.apply(this,arguments)}}},S={create:true,exclusive:false},x;f.readyState=f.INIT;if(!o){o="download"}if(s){m=y(r);t=e.document;i=t.createElementNS("http://www.w3.org/1999/xhtml","a");i.href=m;i.download=o;var T=t.createEvent("MouseEvents");T.initMouseEvent("click",true,false,e,0,0,0,0,0,false,false,false,false,0,null);i.dispatchEvent(T);f.readyState=f.DONE;b();return}if(e.chrome&&p&&p!==l){x=r.slice||r.webkitSlice;r=x.call(r,0,r.size,l);v=true}if(u&&o!=="download"){o+=".download"}if(p===l||u){g=e}if(!a){w();return}c+=r.size;a(e.TEMPORARY,c,E(function(e){e.root.getDirectory("saved",S,E(function(e){var t=function(){e.getFile(o,S,E(function(e){e.createWriter(E(function(t){t.onwriteend=function(t){g.location.href=e.toURL();h.push(e);f.readyState=f.DONE;d(f,"writeend",t)};t.onerror=function(){var e=t.error;if(e.code!==e.ABORT_ERR){w()}};"writestart progress write abort".split(" ").forEach(function(e){t["on"+e]=f["on"+e]});t.write(r);f.abort=function(){t.abort();f.readyState=f.DONE};f.readyState=f.WRITING}),w)}),w)};e.getFile(o,{create:false},E(function(e){e.remove();t()}),E(function(e){if(e.code===e.NOT_FOUND_ERR){t()}else{w()}}))}),w)}),w)},m=v.prototype,g=function(e,t){return new v(e,t)};m.abort=function(){var e=this;e.readyState=e.DONE;d(e,"abort")};m.readyState=m.INIT=0;m.WRITING=1;m.DONE=2;m.error=m.onwritestart=m.onprogress=m.onwrite=m.onabort=m.onerror=m.onwriteend=null;e.addEventListener("unload",p,false);return g}(typeof self!=="undefined"?self:typeof this!=="undefined"&&this.content?this.content:null);if(typeof module!=="undefined")module.exports=saveAs'

var darkThemeCSS = "h1{text-shadow:2px 2px 1px #5A5858}h1,h1 a,h2,h3,h4,h5,h6{color:#FFF!important}.ns-settings{background:#2A2A2A;border:1px solid #383838}.puppet-form{background:#2A2A2A}#nationstates_settings h1{color:#D0D0D0!important}#nationstates_settings{background:#000!important;color:#D0D0D0!important}#nationstates_settings fieldset{background:#2A2A2A!important;border:1px solid #383838!important;color:#D0D0D0!important}.dossier_element{border:6px solid #191919!important;background-color:#191919!important}.older{background:#191919;border:1px #383838 solid}#manage_newspaper{border:solid 2px #fff;background:#000}#inner-content fieldset,#target fieldset{background-color:#000!important}.updatetime{background:#2A2A2A;border:1px solid #383838;color:#D0D0D0!important}#nspp_trophy{-webkit-filter:none!important}#preview{color:#000!important}#alert_msg_box h1,#alert_msg_box h2,#alert_msg_box h3,#alert_msg_box h4,#alert_msg_box h5,#alert_msg_box h6{color:#000!important;text-shadow:2px 2px 1px #FFF}#toggle_dossier_label{border:2px solid #fff!important} .banner-theme {background: #2A2A2A !important;border: 1px solid #383838 !important;}";

var pageUrl = window.location.href;

(function() {
	var pageUrl = window.location.href;
	if (pageUrl.indexOf("template-overall=none") != -1) {
		return;
	}
	if (pageUrl.indexOf("/page=ajax2/") != -1) {
		return;
	}
	$("#banneradbox").remove();

	if (localStorage.getItem("ignore_theme_warning") != "true" && $("#outdated").length == 0) {
		if (document.head.innerHTML.indexOf("antiquity") != -1) {
			$("#main").prepend("<div id='outdated' style='height: 60px; width: 100%; background-image: linear-gradient(-45deg, rgba(255, 255, 0, 1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 0, 1) 50%, rgba(255, 255, 0, 1) 75%, transparent 75%, transparent); background-color: #F00; background-size: 50px 50px;font-size: 56px;font-family: impact;text-align: center;'><a style='color: black;' href='javascript:void(0)' id='fix_theme'>NationStates++ Does Not Support The Antiquity Theme</a></div>");
		} else if ($(".shiny.rmbtable").length != 0) {
			$("#content").prepend("<div id='outdated' style='height: 60px; width: 100%; background-image: linear-gradient(-45deg, rgba(255, 255, 0, 1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 0, 1) 50%, rgba(255, 255, 0, 1) 75%, transparent 75%, transparent); background-color: #F00; background-size: 50px 50px;font-size: 56px;font-family: impact;text-align: center;'><a style='color: black;' href='javascript:void(0)' id='fix_theme'>NationStates++ Does Not Support The Century Theme</a></div>");
		}
		if ($(".shiny.rmbtable").length != 0 || document.head.innerHTML.indexOf("antiquity") != -1) {
			$("#fix_theme").on("click", function(event) {
				event.preventDefault();
				$.get("//www.nationstates.net/page=settings", function(html) {
					var localid = $(html).find("input[name='localid']").val();
					$.post("//www.nationstates.net/page=settings", "localid=" + localid + "&newtheme=default&update=+Update+", function(data) {
						location.reload();
					});
				});
			});
			return;
		}
	}

	if (pageUrl.indexOf("hidePanel=true") != -1) {
		$("#panel").hide();
		$("#content").css("margin-left", "0");
	}
	if (pageUrl.indexOf("hideFooter=true") != -1) {
		$("#foot").remove();
	}
	if (pageUrl.indexOf("hideFlag=true") != -1) {
		$(".bigflag").remove();
	}

	if ($("link[href^='/ns.dark']").length > 0) {
		addStylesheetString(darkThemeCSS);
		addStylesheet("//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/themes/ui-darkness/jquery-ui.min.css");
	} else {
		addStylesheet("//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/themes/ui-lightness/jquery-ui.min.css");
	}

	if (document.head.innerHTML.indexOf("//ajax.googleapis.com/ajax/libs/jquery") != -1) {
		addJavascriptString(googleAnalytics);
	}

	if (pageUrl.indexOf("page=blank") != -1) {
		addJavascriptString(fileSaverjs);
	}

	loadJavascript();
})();

function loadJavascript() {
	if (pageUrl.indexOf('www.nationstates.net/') > -1) {
		console.log('[NationStates++] Detected NationStates Page. Loading...');

		if (document.head.innerHTML.indexOf("//ajax.googleapis.com/ajax/libs/jquery") != -1) {
			addJavascriptString(highchartsAdapter);
		}

		console.log('[NationStates++] Loading Completed Successfully.');
	} else if (pageUrl.indexOf('forum.nationstates.net/') > -1 ) {
		console.log('[NationStates++] Detected NationStates Forum Page. Loading...');
		addStylesheet("//www.nationstates.net/ghbuttons_v2.css", false);
		var settings = getSettings();
		settings.update();

		if (window.location.href.indexOf("posting.php?mode=post&f=15") != -1) {
			$("#postingbox").find(".inner:first").prepend("<div style='font-size: 16px; color: red; font-weight: bold; text-align: center;'>If you are reporting a bug in NationStates, be sure you disable NationStates++ and reproduce the bug to verify that it is not a bug with the NationStates++ extension first!</div>");
		}

		if (settings.isEnabled("highlight_op_posts")) {
			var color = hexToRgb(settings.getValue("highlight_color", "#39EE00"));
			color.alpha = parseFloat(settings.getValue("highlight_color_transparency", "0.1"));
			$("body").append("<style type='text/css'>.op_posts { background-color: rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + color.alpha + ") !important; }</style>");
			highlightAuthorPosts();
		}

		if (settings.isEnabled("floating_sidepanel")) {
			$("#nssidebar").css("margin-top", "-" + Math.min($(window).scrollTop(), 100) + "px");
			$("#nssidebar").find("iframe").css("height", Math.max($(window).height(), 800) + "px");
			$( window ).scroll(function() {
				$("#nssidebar").css("margin-top", "-" + Math.min($(window).scrollTop(), 100) + "px");
			});
			$("#nssidebar").css("position", "fixed");
		}

		if (settings.isEnabled("egosearch_ignore")) {
			showForumEgoposts();
		}

		if (settings.isEnabled("post_ids")) {
			if (window.location.href.indexOf("viewtopic.php") != -1) {
				$("div.post").each(function() {
					var marginLeft = 11 + (8 - $(this).attr("id").substring(1).length) * 4.4;
					$(this).find(".profile-icons").prepend("<li class='post-id-icon'><a href=" + window.location.href.split("#")[0] + "#" + $(this).attr("id") + " title='Post Number' target='_blank'><span class='post-id-text' style='margin-left:" + marginLeft + "px;'>" + $(this).attr("id").substring(1) + "</span></a></li>");
				});
			}
		}

		$(".icon-logout").hide();
		console.log('[NationStates++] Loading Completed Successfully.');
	}
}

function highlightAuthorPosts() {
	if (window.location.href.indexOf("search.php") != -1) return;
	if (window.location.href.match("t=[0-9]+") != null && $(".postprofile:first").length > 0) {
		var highlightPosts = function(opNation) {
			$(".post").each(function() {
				var href = $(this).find(".postprofile:first").find("a:first").attr("href");
				var nation = href.split("/")[href.split("/").length - 1];
				if (nation == opNation) {
					$(this).addClass("op_posts");
				}
			});
		}
		if (window.location.href.match("start=[0-9]+") != null || window.location.href.match("p=[0-9]+") != null || window.location.href.indexOf("view=") != -1) {
			var regex = new RegExp("t=[0-9]{1,}", "g");
			var thread = window.location.href.match(regex)[0].substring(2);
			$.get("//forum.nationstates.net/viewtopic.php?t=" + thread + "&start=0", function(data) {
				var href = $(data).find(".postprofile:first").find("a:first").attr("href");
				var nation = href.split("/")[href.split("/").length - 1];
				highlightPosts(nation);
			});
		} else {
			var href = $(".postprofile:first").find("a:first").attr("href");
			var nation = href.split("/")[href.split("/").length - 1];
			highlightPosts(nation);
		}
	}
}

function showForumEgoposts() {
	var pageUrl = window.location.href.indexOf("#") > -1 ? window.location.href.substring(0, window.location.href.indexOf("#")) : window.location.href;

	//Search page
	if (pageUrl.indexOf("/search.php?") > -1) {
		$(".lastpost:not(:first)").parent().append("<button class='ignore-egopost btn'><div class='ignore-egopost-body'>Ignore</div></button>");
		getUserData(true).update();
		var userData = getUserData(true);
		var ignoredTopics = userData.getValue("ignored_topics", {});
		var modified = false;
		$("ul.topiclist.topics").find("li.row").find("h3:first a").each(function() {
			var threadId = $(this).attr("href").match("t=[0-9]+")[0].substring(2);
			if (localStorage.getItem($(this).html()) == "true") {
				$(this).parents("li.row").hide();
				ignoredTopics[threadId] = true;
				localStorage.removeItem($(this).html());
				modified = true;
			}
			if (ignoredTopics[threadId]) {
				$(this).parents("li.row").hide();
			}
		});
		userData.setValue("ignored_topics", ignoredTopics);
		if (modified) {
			console.log("Updating user data");
			userData.pushUpdate();
		}
		$(".lastpost:first").parent().append("<button class='showall-egopost btn'><div class='showall-egopost-body'>Show All Posts</div></button>");
		$("button.ignore-egopost").on("click", function(event) {
			event.preventDefault();
			$(this).parents("li.row").animate({ height: 'toggle' }, 500);
			var threadId = $(this).parents("li.row").find("h3:first a").attr("href").match("t=[0-9]+")[0].substring(2);
			console.log("Hiding: " + threadId);
			var userData = getUserData(true);
			userData.setValue(userData.getValue("ignored_topics", {})[threadId] = true);
			userData.pushUpdate();
		});
		$("button.showall-egopost").on("click", function(event) {
			$("button.showall-egopost").attr("disabled", true);
			var userData = getUserData(true);
			var igoredTopics = userData.getValue("ignored_topics", {});
			$("ul.topiclist.topics").find("li.row:hidden").each(function() {
				$(this).animate({ height: 'toggle' }, 500);
				var threadId = $(this).find("h3:first a").attr("href").match("t=[0-9]+")[0].substring(2);
				console.log("restoring: " + threadId);
			});
			userData.setValue("ignored_topics", {});
			userData.pushUpdate(function() { 
				$("button.showall-egopost").removeAttr("disabled");
			});
		});
	}
};

function addStylesheet(url) {
	var style = document.createElement('link');
	style.setAttribute('rel', 'stylesheet');
	style.setAttribute('type', 'text/css');
	style.setAttribute('href', url);
	document.head.appendChild(style);
}

function addStylesheetString(css) {
	var style = document.createElement('style');
	style.setAttribute('type', 'text/css');
	style.textContent = css;
	document.head.appendChild(style);
}

function addJavascriptString(js, onLoad) {
	var script = document.createElement('script');
	script.type = "text/javascript";
	script.textContent = js;
	if (onLoad) {
		script.addEventListener('load', onLoad);
	}
	document.head.appendChild(script);
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}