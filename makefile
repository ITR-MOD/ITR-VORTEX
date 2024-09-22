default: itr1-vortex itr2-vortex

<<<<<<< HEAD
itr1:
	-rm -f game-intotheradiusvr.zip
	sed -i "s/^  \"name\":.*/  \"name\": \"Game: Into The Radius VR\",/" info.json
	sed -i "s/^const GAME_DISPLAY_NAME =.*/const GAME_DISPLAY_NAME = 'Into the Radius VR';/" index.js
	sed -i "s/^const GAME_INTERNAL_ID =.*/const GAME_INTERNAL_ID = 'IntoTheRadius';/" index.js
	sed -i "s/^const GAME_EXECUTABLE =.*/const GAME_EXECUTABLE = 'IntoTheRadius.exe';/" index.js
	sed -i "s/^const GAME_STEAM_ID =.*/const GAME_STEAM_ID = '1012790';/" index.js
	sed -i "s/^const GAME_SHORT_NAME =.*/const GAME_SHORT_NAME = 'ITR1';/" index.js
	7z a game-intotheradiusvr.zip index.js info.json assets/

itr2:
	-rm -f game-intotheradius2.zip
	sed -i "s/^  \"name\":.*/  \"name\": \"Game: Into The Radius 2\",/" info.json
	sed -i "s/^const GAME_DISPLAY_NAME =.*/const GAME_DISPLAY_NAME = 'Into the Radius 2';/" index.js
	sed -i "s/^const GAME_INTERNAL_ID =.*/const GAME_INTERNAL_ID = 'IntoTheRadius2';/" index.js
	sed -i "s/^const GAME_EXECUTABLE =.*/const GAME_EXECUTABLE = 'IntoTheRadius2.exe';/" index.js
	sed -i "s/^const GAME_STEAM_ID =.*/const GAME_STEAM_ID = '2307350';/" index.js
	sed -i "s/^const GAME_SHORT_NAME =.*/const GAME_SHORT_NAME = 'ITR2';/" index.js
	7z a game-intotheradius2.zip index.js info.json assets/
=======
MO2 ?= E:/Modding/MO2

itr1-vortex:
	-rm -f game-intotheradiusvr-vortex.zip
	sed -i "s/ITR2/ITR1/g" index.js
	sed -i "s/Into the Radius 2/Into The Radius/g" index.js
	sed -i "s/Into The Radius 2/Into The Radius/g" info.json
	sed -i "s/IntoTheRadius2/IntoTheRadius/g" index.js
	sed -i "s/intotheradius2/intotheradiusvr/g" index.js
	sed -i "s/2307350/1012790/g" index.js
	7z a game-intotheradiusvr-vortex.zip index.js info.json assets/

itr2-vortex:
	-rm -f game-intotheradius2-vortex.zip
	sed -i "s/ITR1/ITR2/g" index.js
	sed -i "s/Into The Radius/Into the Radius 2/g" index.js
	sed -i "s/Into The Radius/Into The Radius 2/g" info.json
	sed -i "s/IntoTheRadius/IntoTheRadius2/g" index.js
	sed -i "s/intotheradiusvr/intotheradius2/g" index.js
	sed -i "s/1012790/2307350/g" index.js
	7z a game-intotheradius2-vortex.zip index.js info.json assets/
>>>>>>> 4c9b091 (prep for mo2 plugin dev)

clean:
	-rm -f game-intotheradius2-vortex.zip
	-rm -f game-intotheradiusvr-vortex.zip

.PHONY: all clean
