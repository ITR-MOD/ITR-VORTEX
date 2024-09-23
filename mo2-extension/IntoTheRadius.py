import mobase
import os
import shutil

# Define the game folder and PAK directory
PAK_DIRECTORY = os.path.join("IntoTheRadius", "Content", "Paks")


class IntoTheRadiusPlugin(mobase.IPlugin):
    def init(self, organizer: mobase.IOrganizer):
        self.organizer = organizer
        return True

    def name(self):
        return "Into The Radius PAK Organizer"

    def author(self):
        return "YourName"

    def description(self):
        return "Moves .pak files from mods to the IntoTheRadius/Content/Paks directory."

    def version(self):
        return mobase.VersionInfo(1, 0, 0, 0)

    def settings(self):
        return []

    def isActive(self):
        """Returns whether the plugin is enabled."""
        return True

    def supportedGames(self):
        """Return the game(s) this plugin supports."""
        return ["Into The Radius"]

    def onModInstalled(self, mod):
        """Called whenever a mod is installed in MO2."""
        mod_path = self.organizer.getMod(mod)

        # Find PAK files in the mod folder
        for root, dirs, files in os.walk(mod_path):
            for file in files:
                if file.endswith(".pak"):
                    pak_file = os.path.join(root, file)
                    # Move the .pak file to the Paks folder
                    self.move_pak_file(pak_file)

    def move_pak_file(self, pak_file):
        """Move the PAK file to the game's PAK folder."""
        try:
            shutil.move(pak_file, PAK_DIRECTORY)
            print(f"Moved {pak_file} to {PAK_DIRECTORY}")
        except Exception as e:
            print(f"Failed to move {pak_file}: {e}")


def createPlugin():
    return IntoTheRadiusPlugin()
