default: clean
	7z a game-intotheradius2.zip index.js info.json assets/

clean:
	-rm -f game-intotheradius2.zip

.PHONY: all clean
