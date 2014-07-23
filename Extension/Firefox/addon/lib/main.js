// Import the page-mod API
var pageMod = require("sdk/page-mod");
// Import the self API
var self = require("sdk/self");

pageMod.PageMod({
  include: ["http://forum.nationstates.net/*", "https://forum.nationstates.net/*"],
  contentScriptWhen: "ready",
  contentScriptFile: [self.data.url("jquery-2.0.3.min.js"), self.data.url("jquery-ui.min.js"), self.data.url("js/nationstates++_common.js"), self.data.url("background.js")],
  contentStyleFile: [ self.data.url("css/bootstrap-button.css"), self.data.url("css/nationstates++.css"), self.data.url("css/forum.css")],
});

pageMod.PageMod({
  include: ["http://www.nationstates.net/*", "https://www.nationstates.net/*"],
  contentScriptWhen: "ready",
  contentScriptFile: [self.data.url("jquery-2.0.3.min.js"), self.data.url("background.js"), self.data.url("js/bootstrap-fileupload.min.js"),
				self.data.url("js/jquery.caret.js"), self.data.url("js/jquery.highlight.js"), self.data.url("js/jquery.nouislider.min.js"),
				self.data.url("js/textFit.min.js"), self.data.url("js/nprogress.js"), self.data.url("js/nationstates++_common.js"), self.data.url("js/websocket.js"), 
				self.data.url("js/nationstates.js"), self.data.url("js/region.js"), self.data.url("js/nation.js"), self.data.url("js/newspapers.js"),
				self.data.url("js/happenings.js"), self.data.url("js/census_slider.js"), self.data.url("js/embassy_flags.js"), self.data.url("js/telegrams.js"),
				self.data.url("js/issues.js"), self.data.url("js/help.js"), self.data.url("js/irc.js"), self.data.url("js/dossier.js"), self.data.url("js/world.js"),
				self.data.url("js/administration.js"), self.data.url("js/settings.js"), self.data.url("js/history.js"), self.data.url("js/puppet_manager.js"), 
				self.data.url("js/puppet_command.js"), self.data.url("js/banhammer.js"), self.data.url("js/recruitment.js"), self.data.url("js/wa.js"), self.data.url("js/alerts.js")],
  contentStyleFile: [ self.data.url("css/nouislider.fox.css"), self.data.url("css/bootstrap-button.css"), self.data.url("css/two_column.css"), 
					  self.data.url("css/bootstrap-fileupload.min.css"), self.data.url("css/nprogress.css"), self.data.url("css/nationstates++.css")],
});

pageMod.PageMod({
  include: ["http://www.nationstates.net/page=blank*", "https://www.nationstates.net/page=blank*"],
  contentScriptWhen: "ready",
  contentScriptFile: [self.data.url("js/bootstrap-dropdown.min.js"), self.data.url("js/bootstrap-fileupload.min.js")],
  contentStyleFile: [ self.data.url("css/bootstrap-fileupload.min.css"), self.data.url("css/newspaper_bootstrap.min.css"), self.data.url("css/bootstrap-table.min.css")],
});