# presets

Named looks shared by every device of a vault: built-ins (`BUILT_IN_PRESETS`, read only, fixed ids a device follows) and the user's own as PRESET vault records (`{ name, look, image? }`; the look is `core/appearance`'s `Look`, the image a `Picture`). Motion and language never travel.

- `usePresets()`: built-in plus own presets, the one writer of PRESET records (`save`, `update`, `rename`: a taken name refused inside the write, `remove` with Undo through `useUndoDelete`) and of this device's follow (`usePresetFollow`, `so:preset`: vault, preset, the look and picture put on). `apply` puts a look on in one reveal, the picture with it. `followed` is the live preset the follow names (a deleted one reads as none, Undo brings it back); `modified` compares the worn look with the one put on.
- `useFollowPreset()`: started once per page by the shell; a device still wearing what it put on takes the followed preset's edits from elsewhere.
- `PresetsBlock`: Settings → Appearance. Tiles draw each look in its own colours (`PresetPreview`, a picture as its colour grid). Desktop saves in a panel and renames in the tile, phones in a sheet; the follow strip offers Update preset (own presets), Save as new and Revert once modified.

Preset pictures stay on the device that saved them for now: another device paints their colours.
