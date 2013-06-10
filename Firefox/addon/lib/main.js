// Import the page-mod API
var pageMod = require("sdk/page-mod");
// Import the self API
var self = require("sdk/self");
 
pageMod.PageMod({
  include: ["http://www.nationstates.net/region=*", "http://forum.nationstates.net/*"],
  contentScriptFile: self.data.url("background.js")
});