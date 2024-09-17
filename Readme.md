Original plugin base was made by `HUNjozsi`
In respect of this their name remains in the info.json

## MOD MAKERS
- Mods underneath a folder titled `LogicMods` gets put into `IntoTheRadius2/Content/Paks/LogicMods`
- Pak mods are not seperated by folder and are put into `IntoTheRadius2/Content/Paks/Mods`
    - Mods that are seperated by folder will be put into `IntoTheRadius2/Content/Paks/Mods/foldername`
- Lua Mods are working, they require to be package like so
    - `ModName/enabled.txt`
    - `ModName/Scripts/`
- You can create shared libraries for other lua mods, *please* package like so
    - `ModName/shared/name.lua`
    - if you dont, there is a high likelyhood that your shared files will be placed in `IntoTheRadius2/Content/Paks/LuaMods/shared/ITR2-Common`