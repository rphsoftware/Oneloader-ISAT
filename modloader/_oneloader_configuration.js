console.log("Loading basic oneloader configuration.");
const MAX_MANIFEST_VERSION = 1;
const ID_BLACKLIST = ["gomori"];
const EXTENSION_RULES = {
    "png": { "encrypt": "rpgmaker", "target_extension": "png" },
    "ogg": { "encrypt": "rpgmaker", "target_extension": "ogg" }
};

const DATA_RULES = [
    {
        jsonKeys: [
            "data", "data_delta"
        ],
        formatMap: {
            "json": { target: "json", delta: false, encrypt: true },
            "jsond": { target: "json", delta: true, delta_method: "json", encrypt: true },
        },
        mountPoint: "data"
    },
    {
        jsonKeys: [
            "plugins", "plugins_delta"
        ],
        formatMap: {
            "js": { target: "js", delta: false, encrypt: true },
            "jsd": { target: "js", delta: true, delta_method: "append", encrypt: true },
            "mjs": { target: "js", delta: false, encrypt: true, parser: "esm" }
        },
        mountPoint: "js/plugins",
        pluginList: true
    }
];

window.$ONELOADER_CONFIG = {
    MAX_MANIFEST_VERSION, ID_BLACKLIST, EXTENSION_RULES, DATA_RULES
};