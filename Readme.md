## Into the Radius 2 Modding Guide

<small>Notice: this readme was made with the aid of chatgpt</small>

### Vortex Extension for Mod Management

This guide explains how to manage mods for *Into the Radius 2* using the Vortex extension. It covers both installing UE4SS and packaging mods to ensure compatibility.

---

### UE4SS Compatibility

You can use any official release of UE4SS, but it’s **recommended** to use the version available on [Nexus Mods for *Into the Radius 2*](https://www.nexusmods.com/intotheradius2/mods/20), as it comes with a default configuration for the game.

This Vortex extension includes a custom `override.txt` to ensure compatibility by:
- Forcing UE4SS to load from the **Pak directory**:  
  `IntoTheRadius2/Content/Paks/`  
  Instead of the default **bin64 directory**:  
  `IntoTheRadius2/Binaries/Win64/`

#### Manual Installation Warning

Manual installation of UE4SS is **not recommended** when using this plugin, as the extension automatically handles placement and configuration. If you prefer a manual install, follow these steps:

1. Place `UE4SS.dll`, `UE4SS-settings.ini`, and the `Mods` folder in the `Paks` directory, **not** the `bin64` folder.
2. **Rename** the `Mods` folder to `LuaMods` before placing it in `Paks`.
3. The plugin copies files as follows:
    - `dwmapi.dll` → `IntoTheRadius2/Binaries/Win64/dwmapi.dll`
    - `UE4SS.dll` → `IntoTheRadius2/Content/Paks/UE4SS.dll`
    - `UE4SS-settings.ini` → `IntoTheRadius2/Content/Paks/UE4SS-settings.ini`
    - `Mods` (renamed to `LuaMods`) → `IntoTheRadius2/Content/Paks/LuaMods`

For ease, it's highly recommended to use Vortex, as it automatically manages these files.

---

### Mod Packaging for Into the Radius 2

When creating mods for *Into the Radius 2*, it is important to follow a specific structure to ensure proper installation through the Vortex extension. This section covers `.pak` mods, Lua mods, shared Lua libraries, and LogicMods.

For a full example of how mods should be structured, refer to the [mod format example on GitHub](https://github.com/Merith-TK/game-intotheradius2-modformat).
