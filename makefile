default: itr1-vortex itr2-vortex

MO2 ?= E:/Modding/MO2

itr1: itr1-vortex itr1-mo2
itr2: itr2-vortex itr2-mo2

itr1-vortex:
	-rm -f game-intotheradiusvr.zip
	sed -i "s/^  \"name\":.*/  \"name\": \"Game: Into The Radius VR\",/" info.json
	sed -i "s/^const GAME_DISPLAY_NAME =.*/const GAME_DISPLAY_NAME = 'Into the Radius VR';/" index.js
	sed -i "s/^const GAME_INTERNAL_ID =.*/const GAME_INTERNAL_ID = 'IntoTheRadius';/" index.js
	sed -i "s/^const GAME_EXECUTABLE =.*/const GAME_EXECUTABLE = 'IntoTheRadius.exe';/" index.js
	sed -i "s/^const GAME_STEAM_ID =.*/const GAME_STEAM_ID = '1012790';/" index.js
	sed -i "s/^const GAME_SHORT_NAME =.*/const GAME_SHORT_NAME = 'ITR1';/" index.js
	7z a game-intotheradiusvr.zip index.js info.json assets/

itr2-vortex:
	-rm -f game-intotheradius2.zip
	sed -i "s/^  \"name\":.*/  \"name\": \"Game: Into The Radius 2\",/" info.json
	sed -i "s/^const GAME_DISPLAY_NAME =.*/const GAME_DISPLAY_NAME = 'Into the Radius 2';/" index.js
	sed -i "s/^const GAME_INTERNAL_ID =.*/const GAME_INTERNAL_ID = 'IntoTheRadius2';/" index.js
	sed -i "s/^const GAME_EXECUTABLE =.*/const GAME_EXECUTABLE = 'IntoTheRadius2.exe';/" index.js
	sed -i "s/^const GAME_STEAM_ID =.*/const GAME_STEAM_ID = '2307350';/" index.js
	sed -i "s/^const GAME_SHORT_NAME =.*/const GAME_SHORT_NAME = 'ITR2';/" index.js
	7z a game-intotheradius2.zip index.js info.json assets/

itr1-mo2:
	sed -i "s/\.png/\.jpg/g" intotheradius.py
	sed -i "s/ITR2/ITR1/g" intotheradius.py
	sed -i "s/Into The Radius 2/Into The Radius/g" intotheradius.py
	sed -i "s/IntoTheRadius2/IntoTheRadius/g" intotheradius.py
	sed -i "s/intotheradius2/intotheradiusvr/g" intotheradius.py
	sed -i "s/2307350/1012790/g" intotheradius.py
	
itr2-mo2:
	sed -i "s/\.jpg/\.png/g" intotheradius.py
	sed -i "s/ITR1/ITR2/g" intotheradius.py
	sed -i "s/Into The Radius/Into The Radius 2/g" intotheradius.py
	sed -i "s/IntoTheRadius/IntoTheRadius2/g" intotheradius.py
	sed -i "s/intotheradiusvr/intotheradius2/g" intotheradius.py
	sed -i "s/1012790/2307350/g" intotheradius.py
	sed -i "s/22/2/g" intotheradius.py

clean:
	-rm -f game-intotheradius2-vortex.zip
	-rm -f game-intotheradiusvr-vortex.zip

.PHONY: all clean
