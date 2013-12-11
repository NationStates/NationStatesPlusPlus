// Import the page-mod API
var pageMod = require("sdk/page-mod");
// Import the self API
var self = require("sdk/self");
 
 pageMod.PageMod({
  include: ["http://nationstatesplusplus.net/api.html", "http://nationstatesplusplus.com/api.html", "http://nationstatesplusplus.org/api.html"],
  contentScriptWhen: "ready",
  contentScriptFile: [self.data.url("jquery-2.0.2.min.js"), self.data.url("js/nspp.js")],
});

pageMod.PageMod({
  include: ["http://forum.nationstates.net/*"],
  contentScriptWhen: "ready",
  contentScriptFile: [self.data.url("jquery-2.0.2.min.js"), self.data.url("jquery-ui.min.js"), self.data.url("js/nationstates++_common.js"), self.data.url("background.js")],
  contentStyleFile: [ self.data.url("css/bootstrap-button.css"), self.data.url("css/nationstates++.css"), self.data.url("css/forum.css")],
});

pageMod.PageMod({
  include: ["http://www.nationstates.net/*"],
  contentScriptWhen: "ready",
  contentScriptFile: [self.data.url("jquery-2.0.2.min.js"), self.data.url("background.js"), self.data.url("js/Blob.js"), self.data.url("js/FileSaver.js"), self.data.url("js/bootstrap-fileupload.min.js"),
				self.data.url("js/jquery.caret.js"), self.data.url("js/jquery.highlight.js"), self.data.url("js/jquery.nouislider.min.js"),
				self.data.url("js/textFit.min.js"), self.data.url("js/nprogress.js"), self.data.url("js/nationstates++_common.js"), 
				self.data.url("js/nationstates.js"), self.data.url("js/region.js"), self.data.url("js/nation.js"), self.data.url("js/newspapers.js"),
				self.data.url("js/happenings.js"), self.data.url("js/census_slider.js"), self.data.url("js/embassy_flags.js"), self.data.url("js/telegrams.js"),
				self.data.url("js/issues.js"), self.data.url("js/help.js"), self.data.url("js/irc.js"), self.data.url("js/dossier.js"), self.data.url("js/world.js"),
				self.data.url("js/administration.js"), self.data.url("js/settings.js"), self.data.url("js/activity.js"), self.data.url("js/history.js"), self.data.url("js/puppet_c&c.js")],
  contentStyleFile: [ self.data.url("css/nouislider.fox.css"), self.data.url("css/bootstrap-button.css"), self.data.url("css/two_column.css"), 
					  self.data.url("css/bootstrap-fileupload.min.css"), self.data.url("css/nprogress.css"), self.data.url("css/nationstates++.css")],
});