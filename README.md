NationStates++ Project Layout
=============
- Assembly [play! framework 2.2 project]
     - app [java codebase]
     - conf [play! framework settings & endpoints]
- Extension [all extension/front-end code]
 - Chrome [chrome specific manifest & background.js]
 - Firefox [Firefox addon install manifest]
     - addon [Firefox SDK-generated root addon folder]
         - data [Firefox specific background.js]
         - lib [Firefox main.js (addon entrypoint)]
 - Safari [container for Safari content]
     - nationstates++.safariextension [auto-generated Safari extension folder]
  - css [Location of CSS for inclusion into extension]
  - js [Location of JS for inclusion into the extension]
  - highcarts-adapter.js [Injected JS to interface from extension to highcharts.js at nationstates.net]

=============
Libraries included in .jar form, not in maven repos:
- NS-API: https://github.com/Afforess/ns-api
     - Java Object model of the NationStates XML API
- NS-DUMPS: https://github.com/Afforess/ns-dumps
     - Converts NationStates XML dumps into standardize database schema
- Cereal(ization): https://github.com/Afforess/Cerealization
     - Library for easy YAML configuration handling
