<small>Notice: this readme was made with the aid of chatgpt</small>

## UE4SS Compatibility

You can use any official release of UE4SS as if it were a mod. However, it is **recommended** to use the version available on [Nexus Mods for *Into the Radius 2*](https://www.nexusmods.com/intotheradius2/mods/20), as it comes with a default configuration for the game.

This extension also includes a custom `override.txt` file, which ensures compatibility by:
- Forcing UE4SS to load from the game's **Pak directory**:  
  `IntoTheRadius2/Content/Paks/`
- Instead of the default **bin64 directory**:  
  `IntoTheRadius2/Binaries/Win64`

### Manual Installation Warning

While it is possible to manually install UE4SS, **this is not recommended** when using this plugin, as the extension automatically handles the installation and configuration of UE4SS. If you still wish to perform a manual install, the following logic must be followed:

1. The `UE4SS.dll`, `UE4SS-settings.ini`, and `Mods` folder should be placed in the Pak directory, **not** the `bin64` folder.
2. **Important:** The `Mods` folder must be renamed to `LuaMods` before being placed in the `Paks` directory.
3. The plugin copies the necessary files as follows:
    - **`dwmapi.dll`** to: `IntoTheRadius2/Binaries/Win64/dwmapi.dll`
    - **`UE4SS.dll`** to: `IntoTheRadius2/Content/Paks/UE4SS.dll`
    - **`UE4SS-settings.ini`** to: `IntoTheRadius2/Content/Paks/UE4SS-settings.ini`
    - **`Mods` folder** (renamed to `LuaMods`) to: `IntoTheRadius2/Content/Paks/LuaMods`

Installing UE4SS through **Vortex** is highly recommended, as this extension automatically handles the placement of these files.

## MOD PACKAGING GUIDE FOR INTO THE RADIUS 2

This guide explains the required structure for packing mods to ensure they are correctly installed by the Vortex extension for *Into the Radius 2*. It covers `.pak` mods, Lua mods, shared Lua libraries, and LogicMods. Please follow this format to avoid installation issues.

For a full example of how mods should be structured, refer to the [mod format example on GitHub](https://github.com/Merith-TK/game-intotheradius2-modformat).

### **PAK MODS**

These are standard Unreal Engine `.pak` mods, and they should be placed under `IntoTheRadius2/Content/Paks/Mods/`.

- **Preferred Structure:**
  - Inside a folder named after your mod at the root of the zip.
    ```
    mod.zip/modName/mod.pak
    ```
  - This will result in:
    ```
    IntoTheRadius2/Content/Paks/Mods/modName/mod.pak
    ```

- **Alternative Structure (Not Recommended):**
  - If the `.pak` file is placed in a subfolder other than `modName`, it will be installed to a folder with the subfolder name.
    ```
    mod.zip/folder/mod.pak
    ```
  - This will result in:
    ```
    IntoTheRadius2/Content/Paks/Mods/folder/mod.pak
    ```

### **LUA MODS**

For Lua mods, you must follow a specific structure. The Vortex extension searches for an `enabled.txt` file, and the parent folder of this file will be used as the mod name. Lua mods should be installed to `IntoTheRadius2/Content/Paks/LuaMods/`.

- **Structure:**
  - Place your Lua scripts inside the `Scripts` folder and include an `enabled.txt` file.
    ```
    mod.zip/modName/Scripts/
    mod.zip/modName/enabled.txt
    ```
  - This will result in:
    ```
    IntoTheRadius2/Content/Paks/LuaMods/modName/Scripts/
    IntoTheRadius2/Content/Paks/LuaMods/modName/enabled.txt
    ```

### **SHARED LUA LIBRARIES**

If your mod includes shared Lua libraries or configs, these must be inside a `shared` folder within your mod directory. The contents of the `shared` folder will be placed in the shared directory for `ue4ss`.

- **Structure:**
  ```
  mod.zip/modName/shared/
  ```
  - This will result in:
    ```
    IntoTheRadius2/Content/Paks/LuaMods/shared/modName/
    ```

### **LOGIC MODS**

While LogicMods are currently untested, they should follow the same structure as `.pak` mods. However, the destination folder will be `IntoTheRadius2/Content/Paks/LogicMods/`.

- **Structure:**
  ```
  mod.zip/modName/mod.pak
  ```
  - This will result in:
    ```
    IntoTheRadius2/Content/Paks/LogicMods/modName/mod.pak
    ```

### **EXAMPLE ZIP CONTENTS**

Here’s an example of a properly structured mod archive:

```
mod.zip/
|   +--- example-root.pak
|   +--- example/
|   |   +--- enabled.txt
|   |   +--- example-folder.pak
|   |   +--- LogicMods/
|   |   |   +--- example-logic.pak
|   |   +--- Scripts/
|   |   |   +--- main.lua
|   |   +--- shared/
|   |   |   +--- example.lua
```

### **EXAMPLE INSTALLED PATH CONTENTS**

After installation, the mod will be placed as follows:

```
IntoTheRadius2/Content/Paks/LogicMods/
|   +--- example/
|   |   +--- example-logic.pak

IntoTheRadius2/Content/Paks/LuaMods/
|   +--- example/
|   |   +--- enabled.txt
|   |   +--- Scripts/
|   |   |   +--- main.lua
|   +--- shared/
|   |   +--- example/
|   |   |   +--- example.lua

IntoTheRadius2/Content/Paks/Mods/
|   +--- example/
|   |   +--- example-folder.pak
|   +--- example-root.pak
```