//Stolen from Modernzr, MIT licensed:
var supportsColorInput = (function() {
	var inputElem = document.createElement('input'), bool, docElement = document.documentElement, smile = ':)';
	inputElem.setAttribute('type', 'color');
	bool = inputElem.type !== 'text';
	// We first check to see if the type we give it sticks..
	// If the type does, we feed it a textual value, which shouldn't be valid.
	// If the value doesn't stick, we know there's input sanitization which infers a custom UI
	if (bool) {
		inputElem.value         = smile;
		inputElem.style.cssText = 'position:absolute;visibility:hidden;';
		docElement.appendChild(inputElem);
		docElement.offsetWidth;
		bool = inputElem.value != smile;
		docElement.removeChild(inputElem);
	}
	return bool;
})();

var settingsHTML = '<form id="target" class="form-horizontal"> <fieldset> <h1>NationStates++ Settings</h1> <div class="control-group"> <label class="control-label" for="nationstates_settings">NationStates Settings</label> <div class="controls"> <label class="checkbox" for="scroll_nation_lists" title="Scroll through lists of nations and regions instead of using the paginator"> <input type="checkbox" name="nationstates_settings" id="scroll_nation_lists" default value="Scrolling Nation Lists" title="Scroll through lists of nations and regions instead of using the paginator"> Scrolling Nation Lists </label> <label class="checkbox" for="show_puppet_switcher" title="Show the puppet switcher form on the top menu area"> <input type="checkbox" name="nationstates_settings" id="show_puppet_switcher" default value="Puppet Switcher" title="Show the puppet switcher form on the top menu area"> Puppet Switcher </label> <div id="recruitment" style="display:none"> <label class="checkbox" for="show_recruitment_progress" title="Show the recruitment progress bar"> <input type="checkbox" name="nationstates_settings" id="show_recruitment_progress" default value="Show Recruitment Progress" title="Show the recruitment progress bar"> Show Recruitment Progress </label> </div> </div> </div> <hr style="width:60%;margin-left:1%"> <div class="control-group"> <label class="control-label" for="delegate_settings">WA Delegate Settings</label> <div class="controls"> <label class="checkbox" for="show_wa_proposals" title="Show unread WA proposals in the sidebar (Only for Delegates)"> <input type="checkbox" name="delegate_settings" id="show_wa_proposals" default value="Show WA Proposals" title="Show unread WA proposals in the sidebar (Only for Delegates)"> Show WA Proposals </label> </div> </div> <hr style="width:60%;margin-left:1%"> <div class="control-group"> <label class="control-label" for="telegram_settings">Telegram Settings</label> <div class="controls"> <label class="checkbox" for="clickable_telegram_links" title="Turn www urls into clickable links in telegrams"> <input type="checkbox" name="telegram_settings" id="clickable_telegram_links" default value="Linkify URLs" title="Turn www urls into clickable links in telegrams"> Linkify URLs </label> </div> </div> <hr style="width:60%;margin-left:1%"> <div class="control-group"> <label class="control-label" for="region_settings">Regional Settings</label> <div class="controls"> <label class="checkbox" for="embassy_flags" title="Show scrolling vertical flags of embassies on region pages"> <input type="checkbox" name="region_settings" id="embassy_flags" default value="Embassy Flags" title="Show scrolling vertical flags of embassies on region pages"> Embassy Flags </label> <label class="checkbox" for="search_rmb" title="Show the regional message board search form on region pages"> <input type="checkbox" name="region_settings" id="search_rmb" default value="Search Message Board" title="Show the regional message board search form on region pages"> Search Message Board </label> <label class="checkbox" for="infinite_scroll" title="Automatically load older message board posts as you scroll down"> <input type="checkbox" name="region_settings" id="infinite_scroll" default value="Infinite Scroll Message Board" title="Automatically load older message board posts as you scroll down"> Infinite Scroll Message Board </label>  <div style="display:none"> <label class="checkbox" for="show_ignore" title="Show an ignore button on regional message board posts"> <input type="checkbox" name="region_settings" id="show_ignore" default value="Show Ignore Button" title="Show an ignore button on regional message board posts"> Show Ignore Button </label> </div> <label class="checkbox" for="auto_update" title="Check for new regional messages and display them at the top of the message board automatically"> <input type="checkbox" name="region_settings" id="auto_update" default value="Auto Update Messages" title="Check for new regional messages and display them at the top of the message board automatically"> Auto Update Messages </label> <label class="checkbox" for="clickable_links" title="Turn www urls into clickable links in regional message board posts"> <input type="checkbox" name="region_settings" id="clickable_links" default value="Linkify URLs" title="Turn www urls into clickable links on regional message board posts"> Linkify URLs </label> <label class="checkbox" for="show_all_suppressed_posts" title="Show suppressed posts automatically"> <input type="checkbox" name="region_settings" id="show_all_suppressed_posts" default value="Auto-Show Suppressed Posts" title="Show suppressed posts automatically"> Auto-Show Suppressed Posts </label> <label class="checkbox" for="show_regional_map_preview" title="Show a preview image of the regional map when you hover over the regional map link"> <input type="checkbox" name="region_settings" id="show_regional_map_preview" default value="Show Regional Map Preview" title="Show a preview image of the regional map when you hover over the regional map link"> Show Regional Map Preview </label> </div> </div> <hr style="width:60%;margin-left:1%"> <div class="control-group"> <label class="control-label" for="sidebar_settings">Sidebar Settings</label> <div class="controls"> <label class="checkbox" for="automatically_hide_flag" title="If the large nation flag can not fit on the sidebar, it will be hidden automatically"> <input type="checkbox" name="sidebar_settings" id="automatically_hide_flag" default value="Hide Flag For Small Screens" title="If the large nation flag can not fit on the sidebar, it will be hidden automatically"> Hide Flag For Small Screens </label> <label class="checkbox" for="show_gameplay_news" title="Show the gameplay news in the sidebar"> <input type="checkbox" name="sidebar_settings" id="show_gameplay_news" default value="Gameplay News" title="Show the gameplay news in the sidebar"> Gameplay News </label> <label class="checkbox" for="show_roleplay_news" title="Show the roleplay news in the sidebar"> <input type="checkbox" name="sidebar_settings" id="show_roleplay_news" default value="Roleplay News" title="Show the roleplay news in the sidebar"> Roleplay News </label> <label class="checkbox" for="show_regional_news" title="Show the regional news in the sidebar (only if your region has a newspaper)"> <input type="checkbox" name="sidebar_settings" id="show_regional_news" default value="Regional News" title="Show the regional news in the sidebar (only if your region has a newspaper)"> Regional News </label> <label class="checkbox" for="floating_sidepanel" title="The sidebar are will stay centered on any page, even when you scroll down"> <input type="checkbox" name="sidebar_settings" id="floating_sidepanel" default value="Floating Sidebar" title="The sidebar are will stay centered on any page, even when you scroll down"> Floating Sidebar </label> <label class="checkbox" for="show_dispatches" title="Show dispatches link on the sidebar"> <input type="checkbox" name="sidebar_settings" id="show_dispatches" default value="Show Dispatches" title="Show dispatches link on the sidebar"> Show Dispatches </label> </div> </div> <hr style="width:60%;margin-left:1%"> <div class="control-group"> <label class="control-label" for="forum_settings">Forum Settings</label> <div class="controls"> <label class="checkbox" for="post_ids" title="Show the forum post id on each forum post"> <input type="checkbox" name="forum_settings" id="post_ids" value="Post IDs" title="Show the forum post id on each forum post"> Post IDs </label> <label class="checkbox" for="egosearch_ignore" title="Allow individual hiding of topics in your &quot;View Your Posts&quot; (Ego-Search) view"> <input type="checkbox" name="forum_settings" id="egosearch_ignore" value="Customize Ego-Search Topics" title="Allow individual hiding of topics in your &quot;View Your Posts&quot; (Ego-Search) view"> Customize Ego-Search Topics </label> <label class="checkbox" for="highlight_op_posts" title="Highlight posts by the author in any thread"> <input type="checkbox" name="forum_settings" id="highlight_op_posts" value="Highlight Author Posts" title="Highlight posts by the author in any thread"> Highlight Author Posts </label> <label class="color" for="highlight_color" title="Change the default color of author post highlighting"> <input type="color" style="width:60px" name="forum_settings" id="highlight_color" value="Highlight Post Color" title="Change the default color of author post highlighting" default> Highlight Post Color </label> <label class="color" for="highlight_color_transparency" title="Change the default transparency of author post highlighting (between 0 and 1)"> <input type="text" style="width:30px" maxlength="4" name="forum_settings" id="highlight_color_transparency" value="0.1" title="Change the default transparency of author post highlighting (between 0 and 1)" default> Highlight Color Transparency </label> </div> </div> <hr style="width:60%;margin-left:1%"> <div class="control-group"> <label class="control-label" for="irc_network_override">IRC Network Override:</label> <div class="controls"> <input style="width:400px;margin-bottom:10px" type="text" name="irc_network_override" id="irc_network_override" default title="Overrides the IRC network you connect to for KiwiIRC. Leave alone unless you know what you are doing"> </div> <label class="control-label" for="irc_username_override">IRC User Override:</label> <div class="controls"> <input style="width:400px" type="text" name="irc_username_override" id="irc_username_override" default title="Overrides the IRC username you connect as for KiwiIRC."> </div> </div> <hr style="width:60%;margin-left:1%"> <div class="control-group"> <label class="control-label" for="puppet-settings">Puppet Settings</label> <div class="controls"> <label class="checkbox" title="When hovering over puppet nation names, the region they are in will appear beneath" for="show-region-on-hover"> <input type="checkbox" name="show-region-on-hover" id="show-region-on-hover" default value="Show puppet regions on hover"> Show Puppet Regions on Hover </label> <label class="checkbox" title="When switching to a puppet nation, you will be redirected to their nation page automatically" for="redirect-puppet-page"> <input type="checkbox" name="redirect-puppet-page" id="redirect-puppet-page" default value="Show Nation Page on Switch"> Show Nation Page on Switch </label> <label class="checkbox" title="The last puppet you logged into will be remembered and used when you come back to NationStates" for="autologin-puppets"> <input type="checkbox" name="autologin-puppets" id="autologin-puppets" default value="Remember Last Puppet"> Remember Last Puppet </label> </div> </div> <div class="control-group"> <label class="control-label" for="export_puppets">Export Puppets</label> <div class="controls"> <button id="export_puppets" name="export_puppets" class="btn btn-default">Download Puppets</button> </div> </div> <div class="control-group"> <label class="control-label" for="import_buttons">Import Puppets</label> <div class="controls"> <div class="fileupload fileupload-new" data-provides="fileupload"> <div class="input-append"> <div class="uneditable-input span3"><i class="icon-file fileupload-exists"></i> <span class="fileupload-preview"></span></div><span class="btn btn-file"><span class="fileupload-new">Select file</span><span class="fileupload-exists">Change</span><input name="import_buttons" id="import_buttons" type="file"></span><a href="#" class="btn fileupload-exists" data-dismiss="fileupload">Remove</a> <button id="import_puppets_btn" class="btn btn-default" style="margin-top:-1px;margin-left:20px">Import Puppets</button> </div> </div> <div id="unparseable" style="display:none;color:red">Error parsing file: </div> <div id="parsed-success" style="display:none;color:green">Puppets imported successfully!</div> </div> </div> <div class="control-group"> <label class="control-label" for="clear_all_puppets">Erase All Puppets</label> <div class="controls"> <button id="clear_all_puppets" name="clear_all_puppets" class="btn btn-danger">Clear Puppets</button> </div> </div> <hr style="width:60%;margin-left:1%"> <div class="control-group"> <label class="control-label" for="save_settings"></label> <div class="controls"> <button id="save_settings" name="save_settings" class="btn btn-success">Save Settings</button> <button id="reset_settings" name="reset_settings" class="btn btn-danger">Reset Settings</button> </div> </div> <p><a href="http://afforess.uservoice.com/forums/210362-nationstates-">Suggest Ideas & Features!</a></p> <p style="font-style:italic;font-size:10px">NationStates++ v2.5.0.1</p> </fieldset> </form>';

(function() {
	if (getVisiblePage() == "blank" && window.location.href.indexOf("ns_settings") != -1) {
		window.document.title = "NationStates++ Settings"
		$("#content").html("<div id='loading_gif' style='margin-top: 25px; margin-left:15px; font-weight:bold; font-size:16px;'><img style='margin-bottom: -2px; margin-right: 4px;' src='/images/loading1.gif'>Loading...</span>");
		$("#content").append(settingsHTML);
		$(".form-horizontal").hide();
		sendWebsocketEvent("is_recruitment_officer", { }, false);
		$(window).on("websocket.is_recruitment_officer", function(data) {
			if (data.json.result == "true") {
				$("#recruitment").show();
			}
		});

		if (supportsColorInput) {
			$("input[type='color']").css("width", "15px");
		}
		$("#content").find("input[type='checkbox']").each(function() {
			var settingId = $(this).attr("id");
			(new UserSettings()).child(settingId).on(function(data) {
				$(".form-horizontal").show();
				$("#loading_gif").hide();
				$("#" + settingId).prop("checked", data[settingId]);
			}, $(this).attr("default"));
		});
		$("#content").find("input[type='text'], input[type='color']").each(function() {
			var settingId = $(this).attr("id");
			(new UserSettings()).child(settingId).on(function(data) {
				$("#" + settingId).val(data[settingId]);
			}, $(this).attr("default"));
		});
		$("#export_puppets").on("click", function(event) {
			event.preventDefault();
			var puppetArr = new Array();
			var manager = getPuppetManager();
			var puppets = manager.getActivePuppetList();
			puppetArr.push('"Nation", "Password"\n');
			for (var name in puppets) {
				var pass = puppets[name];
				puppetArr.push('"' + name.replaceAll("_", " ").toTitleCase() + '", "' + pass + '"\n');
			}
			var blob = new Blob(puppetArr, {type: "text/plain;charset=utf-8"});
			if (typeof saveAs != "undefined") {
				saveAs(blob, "puppets.csv");
			} else {
				$(document.body).append("<div name='save_file' file='puppets.csv' style='display:none;'>" + JSON.stringify(puppetArr) + "</div>");
			}
		});
		var parsingError = function(error) {
			var log = "Error: " + error + "\n";
			if (typeof error != "string") {
				for (var prop in error) {
					log += "    property: " + prop + " value: [" + error[prop] + "]\n"; 
				}
			}
			$("#unparseable-span").remove();
			$("#unparseable").html($("#unparseable").html() + "<span id='unparseable-span'><pre>" + log + "</pre></span>");
			$("#unparseable").show();
			console.log(log);
		}
		$("#import_puppets_btn").on("click", function(event) {
			event.preventDefault();
			var file = document.getElementById('import_buttons').files[0];
			$("#parsed-success").hide();
			$("#unparseable").hide();
			if (file) {
				var reader = new FileReader();
				reader.readAsText(file, "UTF-8");
				reader.onload = function (evt) {
					try {
						$("#unparseable").hide();
						var split = evt.target.result.split("\n");
						var imported = false;
						var manager = getPuppetManager();
						for (var i = 1; i < split.length; i++) {
							var line = split[i];
							if (line.trim() != "" && line.split(",").length == 2) {
								var nation = line.split(",")[0];
								nation = nation.replaceAll('"', "").trim();
								var pass = line.split(",")[1];
								pass = pass.replaceAll('"', "").trim();
								manager.addPuppet(nation.toLowerCase().split(" ").join("_"), pass, manager.getActiveList(), false);
								imported = true;
							}
						}
						if (imported) {
							$("#parsed-success").show();
							manager.save();
						} else {
							parsingError("No data found in file");
						}
					} catch (error) {
						parsingError(error);
					}
				}
				reader.onerror = parsingError;
			} else {
				$("#unparseable").show();
			}
		});
		$("#clear_all_puppets").on("click", function(event) {
			event.preventDefault();
			if ($("#clear_all_puppets").html() != "Are You Sure?") {
				$("#clear_all_puppets").html("Are You Sure?");
				return;
			}
			var manager = getPuppetManager();
			manager.clearPuppetList();
			$("#clear_all_puppets").html("Clear Puppets");
		});
		$("#save_settings").on("click", function(event) {
			event.preventDefault();
			if (!isNumber($("#highlight_color_transparency").val()) || parseFloat($("#highlight_color_transparency").val()) > 1 || parseFloat($("#highlight_color_transparency").val()) < 0) {
				$("#highlight_color_transparency").val($("#highlight_color_transparency").attr('default'));
			}
			if (!(/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test($("#highlight_color").val()))) {
				$("#highlight_color").val($("#highlight_color").attr('default'));
			}
			$("#content").find("input[type='checkbox']").each(function() {
				(new UserSettings()).child($(this).attr("id")).set($(this).prop("checked"));
			});
			$("#content").find("input[type='text'], input[type='color']").each(function() {
				if ($(this).val() != "") {
					(new UserSettings()).child($(this).attr("id")).set($(this).val());
				} else {
					(new UserSettings()).child($(this).attr("id")).set(null);
				}
			});
		});
		$("#reset_settings").on("click", function(event) {
			event.preventDefault();
			if ($("#reset_settings").html() != "Are You Sure?") {
				$("#reset_settings").html("Are You Sure?");
				return;
			}
			$("#content").find("input[type='checkbox']").each(function() {
				(new UserSettings()).child($(this).attr("id")).set($(this).attr("default"));
			});
			$("#content").find("input[type='text']").each(function() {
				(new UserSettings()).child($(this).attr("id")).set(null);
			});
			$("#content").find("input[type='color']").each(function() {
				(new UserSettings()).child($(this).attr("id")).set($(this).attr("default"));
			});
		});
	}
})();
