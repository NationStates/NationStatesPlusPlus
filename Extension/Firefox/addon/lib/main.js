// Import the page-mod API
var pageMod = require("sdk/page-mod");
// Import the self API
var self = require("sdk/self");
 
pageMod.PageMod({
  include: ["http://forum.nationstates.net/*"],
  contentScriptWhen: "end",
  contentScriptFile: [self.data.url("jquery-2.0.2.min.js"), self.data.url("background.js")]
});

pageMod.PageMod({
  include: ["http://www.nationstates.net/*"],
  contentScriptWhen: "end",
  contentScriptFile: [self.data.url("jquery-2.0.2.min.js"), self.data.url("background.js")]
});