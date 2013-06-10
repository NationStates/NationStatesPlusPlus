// Import the page-mod API
var pageMod = require("sdk/page-mod");
// Import the self API
var self = require("sdk/self");
 
pageMod.PageMod({
  include: ["http://forum.nationstates.net/*"],
  contentScriptWhen: "start",
  contentScriptFile: self.data.url("background.js")
});

pageMod.PageMod({
  include: ["http://www.nationstates.net/region=*"],
  contentScriptWhen: "ready",
  contentScriptFile: self.data.url("background.js")
});