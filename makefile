# Define the name of the zip file
ZIP_FILE = game-intotheradius2.zip

# Define the files and directories to include in the zip file
FILES = index.js info.json assets/

# Define the 7z command
7Z = 7z

# Default target
all: $(ZIP_FILE)

# Rule to create the zip file
$(ZIP_FILE): $(FILES)
	$(7Z) a $(ZIP_FILE) $(FILES)

# Clean up the zip file
clean:
	rm -f $(ZIP_FILE)

.PHONY: all clean
