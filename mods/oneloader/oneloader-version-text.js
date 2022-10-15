/*
    This file is part of the OneLoader project and is licensed under the same terms (MIT)
*/

{
    const _injection_point_1 = Scene_Title.prototype.create;
    Scene_Title.prototype.create = function() {
        _injection_point_1.call(this);
        this._one_loader = {
            "loader_version":new Sprite(new Bitmap(640, 32)),
            "mods_loaded":new Sprite(new Bitmap(640, 32)),
            "mods_total":new Sprite(new Bitmap(640, 32)),
            "test_mode":new Sprite(new Bitmap(640, 32))
        };
        let y = 0;
        for (let key in this._one_loader) {
            this.addChild(this._one_loader[key]);
            this._one_loader[key].position.set(0, y);
            this._one_loader[key].bitmap.fontSize = 24;
            y += 32;
        }

        const version = $modLoader.knownMods.get("oneloader").json.version;
        const loadedAmount = $modLoader.knownMods.size;
        const allAmount = $modLoader.allMods.size;

        this._one_loader.loader_version.bitmap.drawText(`OneLoader ${version}`, 4, 4, 640, 16, "left");
        this._one_loader.mods_loaded.bitmap.drawText(`Mods in use: ${loadedAmount}`, 4, 4, 640, 16, "left");
        this._one_loader.mods_total.bitmap.drawText(`Mods total: ${allAmount}`, 4, 4, 640, 16, "left");
        this._one_loader.test_mode.bitmap.drawText(`Unofficial Port. NOT SUPPORTED!.`, 4, 4, 640, 16, "left");
    }
}