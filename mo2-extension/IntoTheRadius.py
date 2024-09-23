import mobase
import os
import shutil

# Define the game folder and PAK directory
ITR1_DIRECTORY = os.path.join("IntoTheRadius", "Content", "Paks")
ITR2_DIRECTORY = os.path.join("IntoTheRadius2", "Content", "Paks")


class IntoTheRadiusPlugin(mobase.IPluginInstaller):
    def init(self, organizer: mobase.IOrganizer):
        self.organizer = organizer
        print("IntoTheRadiusPlugin initialized")
        return True

    def name(self):
        return "Into The Radius Game Support"

    def author(self):
        return "Merith-TK"

    def description(self):
        return "Manages Into The Radius mods."

    def version(self):
        return mobase.VersionInfo(0, 3, 2, 0)

    def settings(self):
        return []

    def isActive(self):
        return True

    def supportedGames(self):
        return [
            "Into The Radius",
            "Into The Radius 2",
            "Into the Radius",
            "Into the Radius 2",
            "IntoTheRadius",
            "IntoTheRadius2",
            "IntotheRadius",
            "IntotheRadius2",
        ]

    def onModInstalled(self, mod):
        """Called when a mod is installed."""
        mod_path = self.organizer.getMod(mod)

        # Find PAK files in the mod folder
        for root, dirs, files in os.walk(mod_path):
            for file in files:
                if file.endswith(".pak"):
                    pak_file = os.path.join(root, file)
                    # Move the .pak file to the Paks folder
                    self.move_pak_file(pak_file)

    """ Helper functions """

    def move_pak_file(self, pak_file):
        """Move the PAK file to the game's PAK folder."""
        try:
            shutil.move(pak_file, ITR1_DIRECTORY)
            print(f"Moved {pak_file} to {ITR1_DIRECTORY}")
        except Exception as e:
            print(f"Failed to move {pak_file}: {e}")


def createPlugin():
    return IntoTheRadiusPlugin()
