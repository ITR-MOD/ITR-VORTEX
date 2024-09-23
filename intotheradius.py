from typing import List, Optional
from ..basic_game import BasicGame

import mobase
import sys


PAK_DIR = "IntoTheRadius2/Content/Paks"
BIN_DIR = "IntoTheRadius2/Binaries/Win64"


def log(msg):
    print(msg, file=sys.stderr)


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

        already_copied = []
        print("FOR FUCKS SAKE WHERE AM I?!", file=sys.stderr)
        ## Status: Working
        # Check for UE4SS logic
        dwmapi_dll = filetree.find("dwmapi.dll")
        ue4ss_dll = filetree.find("ue4ss/UE4SS.dll")
        ue4ss_ini = filetree.find("ue4ss/UE4SS-settings.ini")
        ue4ss_mods = filetree.find("ue4ss/Mods")
        override_txt = filetree.find("override.txt")

        if dwmapi_dll and ue4ss_dll and ue4ss_ini and ue4ss_mods:
            filetree.move(dwmapi_dll, BIN_DIR + "/dwmapi.dll")
            filetree.move(override_txt, BIN_DIR + "/override.txt")
            filetree.move(ue4ss_dll, PAK_DIR + "/UE4SS.dll")
            filetree.move(ue4ss_ini, PAK_DIR + "/UE4SS-settings.ini")
            filetree.move(ue4ss_mods, PAK_DIR + "/LuaMods")
            filetree.remove("ue4ss")
            return filetree

        ## Status: Not Working
        # Filter out 'custom.txt' files and copy them along with their directory contents
        custom_files = [f for f in filetree if f.name() == "custom.txt"]
        for custom_file in custom_files:
            parent_dir = custom_file.parent()
            for entry in parent_dir:
                if entry not in already_copied and entry.name() != "custom.txt":
                    log(f"Moving file: {entry.name()}")
                    filetree.move(entry, entry)
                    already_copied.append(entry)

        ## Status: Not Working
        # Handle LuaMods, LogicMods, and other files
        lua_mod_name = ""
        lua_shared_copy = False

        # Handle enabled.txt logic for LuaMods
        enabled_txt = filetree.find("enabled.txt")
        if enabled_txt:
            log(f"Found enabled.txt: {enabled_txt}")
            lua_mod_name = enabled_txt.parent().name()
            lua_shared_copy = True
            filetree.move(
                enabled_txt,
                f"{PAK_DIR}/LuaMods/{lua_mod_name}/enabled.txt",
            )
            scripts_dir = enabled_txt.parent().find("Scripts")
            if scripts_dir:
                log(f"Moving Scripts directory for {lua_mod_name}")
                filetree.move(
                    scripts_dir,
                    f"{PAK_DIR}/LuaMods/{lua_mod_name}/Scripts",
                )
            shared_dir = enabled_txt.parent().find("Shared")
            if shared_dir:
                log(f"Moving Shared directory for {lua_mod_name}")
                filetree.move(
                    shared_dir,
                    f"{PAK_DIR}/LuaMods/shared/{lua_mod_name}",
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
