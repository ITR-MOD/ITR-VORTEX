from typing import List, Optional

import mobase

from ..basic_game import BasicGame


class IntoTheRadius2ModDataChecker(mobase.ModDataChecker):
    def __init__(self):
        super().__init__()

    def dataLooksValid(
        self, filetree: mobase.IFileTree
    ) -> mobase.ModDataChecker.CheckReturn:
        folders: List[mobase.IFileTree] = []
        files: List[mobase.FileTreeEntry] = []

        return mobase.ModDataChecker.FIXABLE

    def fix(self, filetree: mobase.IFileTree) -> Optional[mobase.IFileTree]:
        instructions = []
        already_copied = []

        # Filter out 'custom.txt' files and copy them along with their directory contents
        custom_files = [entry for entry in filetree if entry.name() == "custom.txt"]
        for custom_file in custom_files:
            custom_dir = custom_file.parent()
            custom_dir_files = [f for f in filetree if f.parent() == custom_dir]
            for file in custom_dir_files:
                if file not in already_copied and file.name() != "custom.txt":
                    print(f"Copying {file} to {file}")
                    filetree.move(
                        file, file, mobase.IFileTree.InsertPolicy.FAIL_IF_EXISTS
                    )
                    already_copied.append(file)

        # Check for UE4SS logic
        ue4ss_files = [
            f
            for f in filetree
            if f.name() == "UE4SS.dll" and f.parent().name() == "ue4ss"
        ]
        if ue4ss_files:
            print("Copying UE4SS.dll, UE4SS-settings.ini, and Mods to root directory")
            ue4ss_dll = filetree.find("dwmapi.dll")
            ue4ss_ini = filetree.find("ue4ss/UE4SS-settings.ini")
            ue4ss_mods = filetree.find("ue4ss/Mods")
            filetree.move(
                ue4ss_dll,
                f"bin/dwmapi.dll",
                mobase.IFileTree.InsertPolicy.REPLACE,
            )
            filetree.move(
                ue4ss_files[0],
                f"IntoTheRadius2/Content/Paks/UE4SS.dll",
                mobase.IFileTree.InsertPolicy.REPLACE,
            )
            filetree.move(
                ue4ss_ini,
                f"IntoTheRadius2/Content/Paks/UE4SS-settings.ini",
                mobase.IFileTree.InsertPolicy.REPLACE,
            )
            filetree.move(
                ue4ss_mods,
                f"IntoTheRadius2/Content/Paks/LuaMods",
                mobase.IFileTree.InsertPolicy.REPLACE,
            )
            return filetree

        # Handle LuaMods, LogicMods, and other files
        lua_mod_dir = ""
        lua_shared_copy = False
        lua_mod_name = ""

        for file in filetree:
            if file in already_copied:
                continue

            file_dir = file.parent()
            base_dir = file_dir.name()

            if base_dir.lower() in ["luamods", "luamod"]:
                lua_mod_name = file_dir.parent().name()
            else:
                lua_mod_name = base_dir

            if file.name() == "enabled.txt":
                lua_mod_dir = file_dir
                filetree.move(
                    file_dir.find("enabled.txt"),
                    f"IntoTheRadius2/Content/Paks/LuaMods/{lua_mod_name}/enabled.txt",
                    mobase.IFileTree.InsertPolicy.FAIL_IF_EXISTS,
                )
                filetree.move(
                    file_dir.find("Scripts"),
                    f"IntoTheRadius2/Content/Paks/LuaMods/{lua_mod_name}/Scripts",
                    mobase.IFileTree.InsertPolicy.FAIL_IF_EXISTS,
                )
                continue

            if (
                base_dir.lower() == "shared"
                and file.name().endswith(".lua")
                and not lua_shared_copy
            ):
                lua_shared_copy = True
                lua_mod_name = (
                    file_dir.parent().name()
                    if lua_mod_name == "shared"
                    else "ITR2-Common"
                )
                filetree.move(
                    file_dir,
                    f"IntoTheRadius2/Content/Paks/LuaMods/shared/{lua_mod_name}",
                    mobase.IFileTree.InsertPolicy.FAIL_IF_EXISTS,
                )
                continue

            ## WORKING-ish
            # Handle .pak, .ucas, .utoc files
            if file.name().endswith((".pak", ".ucas", ".utoc")):
                parent_folder = ""
                if file_dir.parent():
                    parent_folder = file_dir.parent().name()
                mod_name = (
                    file_dir.parent().parent().name()
                    if parent_folder == "LogicMods"
                    else parent_folder
                )
                print(f"PARENT FOLDER: {parent_folder}")
                if parent_folder == "LogicMods":
                    print(
                        f"Copying {file} to IntoTheRadius2/Content/Paks/LogicMods/{mod_name}/{file.name()}"
                    )
                    filetree.move(
                        file,
                        f"IntoTheRadius2/Content/Paks/LogicMods/{mod_name}/{file.name()}",
                        mobase.IFileTree.InsertPolicy.FAIL_IF_EXISTS,
                    )
                else:
                    print(
                        f"Copying {file} to IntoTheRadius2/Content/Paks/Mods/{mod_name}/{file.name()}"
                    )
                    filetree.move(
                        file,
                        f"IntoTheRadius2/Content/Paks/Mods/{mod_name}/{file.name()}",
                        mobase.IFileTree.InsertPolicy.FAIL_IF_EXISTS,
                    )

        return filetree


class IntoTheRadius2Game(BasicGame):
    Name = "Into The Radius 2 Support Plugin"
    Author = "Merith-TK"
    Version = "0.3.2.0"

    GameName = "Into The Radius 2"
    GameShortName = "intotheradius2"
    GameNexusName = "intotheradius2"
    GameSteamId = 2307350
    GameBinary = "IntoTheRadius2.exe"
    GameDataPath = ""
    GameDocumentsDirectory = "%DOCUMENTS%/My Games/IntoTheRadius2"
    GameSavesDirectory = "%DOCUMENTS%/My Games/IntoTheRadius2"
    GameSaveExtension = "sav"
    GameSupportURL = (
        r"https://github.com/ModOrganizer2/modorganizer-basic_games/wiki/"
        "Game:-Into-The-Radius"
    )

    def init(self, organizer: mobase.IOrganizer):
        super().init(organizer)
        # TODO: write "../../Content/Paks" to "IntoTheRadius2/Binaries/Win64/override.txt"
        self._register_feature(IntoTheRadius2ModDataChecker())
        return True
