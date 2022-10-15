{
    if (window.$modLoader && window.$modLoader.success) {
        $modLoader.$runScripts("pre_plugin_injection", {
            PluginManager, $plugins
        });
        
        window._logLine("Patching $plugins");
        let game_supplied_plugins = $plugins.map( a=>a.name.toLowerCase());
        for (let name of Array.from($modLoader.pluginLocks)) {
            if (!game_supplied_plugins.includes(name)) {
                $plugins.push({
                    name,
                    status: true,
                    description: "Modded plugin",
                    parameters: {}
                });
                window._logLine("[PLUGIN_LOADER] Injected " + name);
            }
        }

        $modLoader.knownMods.forEach(mod => {
            if (mod.json.plugin_parameters) {
                for (let plugin in mod.json.plugin_parameters) {
                    let filtered = $plugins.filter(a => a.name.toLowerCase() === plugin.toLowerCase());

                    if (filtered.length < 1) {
                        window._logLine("[PLUGIN PARAMETER PATCHER] Ignored " + plugin + " from  " + mod.json.id + " because no such plugin was found in the game");
                        continue;
                    }

                    let pluginObject = filtered[0];
                    pluginObject.parameters = jsonpatch.applyPatch(pluginObject.parameters, mod.json.plugin_parameters[plugin]).newDocument;
                }
            }
        });
    }

    let ols = PluginManager.loadScript;
    window.$modLoader.pluginPromises = [];
    PluginManager.loadScript = function(name) {
        var url = this._path + name;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = false;
        script.onerror = this.onError.bind(this);
        script._url = url;
        document.body.appendChild(script);

        window.$modLoader.pluginPromises.push(new Promise(resolve => {
            script.onload = resolve;
        }))
    }
}