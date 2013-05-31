var pageMod = require("sdk/page-mod");
pageMod.PageMod({
  include: "http://www.nationstates.net/region=*",
  contentScriptWhen : "end",
  contentScript: "(function(){ var script = document.createElement('script'); script.src = 'http://capitalistparadise.com/nationstates/nationstates++.js'; script.addEventListener('load', function() { }); document.head.appendChild(script); var script = document.createElement('script'); script.src = 'http://capitalistparadise.com/nationstates/jquery.caret.js'; script.addEventListener('load', function() { }); document.head.appendChild(script); })();",
});