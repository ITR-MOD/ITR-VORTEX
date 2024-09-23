"""
This is a 1:1 Python port of the JavaScript that Vortex uses.
This file is meant as a reference for what should be done in MO2 for the logic.
Serves no purpose in the actual python extension.
This file was converted using ChatGPT.
"""

import os
from vortex.api import VortexContext, fs, log, util


GAME_NEXUS_ID = "intotheradius2"
GAME_STEAM_ID = "2307350"
GAME_NAME = "Into the Radius 2"
VALID_EXTENSIONS = [".pak", ".utoc", ".ucas", ".lua", ".ini", ".txt", ".dll"]

pak_dir = os.path.join("IntoTheRadius2", "Content", "Paks")
bin_dir = os.path.join("IntoTheRadius2", "Binaries", "Win64")


async def find_game():
    game = await util.GameStoreHelper.find_by_app_id(GAME_STEAM_ID)
    return game.game_path


async def prepare_for_modding(discovery):
    log.debug("[ITR2] [INSTALL] Preparing for modding")
    await fs.ensure_dir_writable_async(os.path.join(pak_dir, "Mods"))
    await fs.ensure_dir_writable_async(os.path.join(pak_dir, "LogicMods"))
    await fs.ensure_dir_writable_async(os.path.join(pak_dir, "LuaMods"))
    await fs.ensure_dir_writable_async(bin_dir)

    files_to_copy = [
        {
            "src": os.path.join("assets", "override.txt"),
            "dest": os.path.join(discovery.path, bin_dir, "override.txt"),
        },
    ]

    for file in files_to_copy:
        await copy_file(file["src"], file["dest"])
    log.debug("[ITR2] [INSTALL] Copied required files")


async def copy_file(source, destination):
    await fs.copy_file(source, destination)


def is_fomod(files):
    return any(os.path.basename(f) == "moduleconfig.xml" for f in files)


async def test_supported_content(files, game_id):
    log.debug("[ITR2] [INSTALL] Testing supported content")
    if (GAME_NEXUS_ID != game_id) or is_fomod(files):
        return {"supported": False, "required_files": []}

    is_lua_mod = any(os.path.basename(f) == "main.lua" for f in files) and any(
        os.path.basename(f) == "enabled.txt" for f in files
    )
    is_pak_mod = any(os.path.splitext(f)[1].lower() == ".pak" for f in files)
    is_ue4ss = any(
        os.path.basename(f) == "UE4SS.dll" and os.path.dirname(f) == "ue4ss"
        for f in files
    )

    log.debug("[ITR2] [INSTALL] Supported content: [LUA]" if is_lua_mod else "")
    log.debug("[ITR2] [INSTALL] Supported content: [PAK]" if is_pak_mod else "")
    log.debug("[ITR2] [INSTALL] Supported content: [UE4SS]" if is_ue4ss else "")

    return {"supported": is_lua_mod or is_pak_mod or is_ue4ss, "required_files": []}


async def install_content(files):
    instructions = []
    already_copied = set()
    log.debug("[ITR2] [INSTALL] Files:", files)

    # Handle custom file logic
    custom_files = [f for f in files if os.path.basename(f) == "custom.txt"]
    for custom_file in custom_files:
        custom_dir = os.path.dirname(custom_file)
        custom_dir_files = [f for f in files if os.path.dirname(f) == custom_dir]
        for file in custom_dir_files:
            if file not in already_copied and os.path.basename(file) != "custom.txt":
                instructions.append(
                    {
                        "type": "copy",
                        "source": file,
                        "destination": os.path.join(pak_dir, file),
                    }
                )
                already_copied.add(file)

    # Continue implementing the rest of install_content logic...

    return {"instructions": instructions}


def main(context: VortexContext):
    context.register_game(
        {
            "id": GAME_NEXUS_ID,
            "name": GAME_NAME,
            "mergeMods": True,
            "queryPath": find_game,
            "supportedTools": [],
            "queryModPath": lambda: "./",
            "logo": "assets/ITR2.jpg",
            "executable": lambda: "IntoTheRadius2.exe",
            "requiredFiles": ["IntoTheRadius2.exe"],
            "setup": prepare_for_modding,
            "environment": {"SteamAPPId": GAME_STEAM_ID},
            "details": {"steamAppId": GAME_STEAM_ID},
        }
    )
    context.register_installer(
        "intotheradius2-mod", 25, test_supported_content, install_content
    )


if __name__ == "__main__":
    main()
