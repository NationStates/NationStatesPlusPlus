var pageMod = require("sdk/page-mod");
var data = require("self").data;
pageMod.PageMod({
  include: "http://www.nationstates.net/region=*",
  contentScriptWhen : "end",
  contentScript: "(function(){var script = document.createElement('script'); script.type = 'text/javascript'; script.src = '" + data.url("nationstates++.js") + "'; document.head.appendChild(script);})();",
});