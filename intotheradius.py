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

        for entry in filetree:
            if isinstance(entry, mobase.IFileTree):
                folders.append(entry)
            else:
                files.append(entry)

        if len(folders) != 1:
            return mobase.ModDataChecker.INVALID

        folder = folders[0]
        pakfile = folder.name() + ".pak"
        if folder.exists(pakfile):
            if filetree.exists(pakfile):
                return mobase.ModDataChecker.VALID
            else:
                return mobase.ModDataChecker.FIXABLE

        return mobase.ModDataChecker.INVALID

    def fix(self, filetree: mobase.IFileTree) -> Optional[mobase.IFileTree]:
        first_entry = filetree[0]
        if not isinstance(first_entry, mobase.IFileTree):
            return None
        entry = first_entry.find(filetree[0].name() + ".pak")
        if entry is None:
            return None
        filetree.copy(entry, "", mobase.IFileTree.InsertPolicy.FAIL_IF_EXISTS)
        return filetree


class IntoTheRadius2Game(BasicGame):
    Name = "Into The Radius 2 Support Plugin"
    Author = "MerithXYZ"
    Version = "0.3.2"

    GameName = "Into The Radius 2"
    GameShortName = "intotheradius2"
    GameNexusName = "intotheradius2"
    GameSteamId = 2307350
    GameBinary = "IntoTheRadius2.exe"
    GameDataPath = ""
    GameDocumentsDirectory = "%GAME_PATH%"
    GameSavesDirectory = "%GAME_PATH%/Save"
    GameSaveExtension = "sav"
    GameSupportURL = (
        r"https://github.com/ModOrganizer2/modorganizer-basic_games/wiki/"
        "Game:-Into-The-Radius"
    )

    def init(self, organizer: mobase.IOrganizer):
        super().init(organizer)
        self._register_feature(IntoTheRadius2ModDataChecker())
        return True
