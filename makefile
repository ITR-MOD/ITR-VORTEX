default: clean
	7z a game-intotheradius2.zip index.js info.json assets/

itr1:
	-rm -f game-intotheradius1.zip
	sed -i "s/ITR2/ITR1/g" index.js
	sed -i "s/Into the Radius 2/Into The Radius/g" index.js
	sed -i "s/Into The Radius 2/Into The Radius/g" info.json
	sed -i "s/IntoTheRadius2/IntoTheRadius/g" index.js
	sed -i "s/intotheradius2/intotheradiusvr/g" index.js
	sed -i "s/2307350/1012790/g" index.js
	7z a game-intotheradius1.zip index.js info.json assets/

itr2:
	-rm -f game-intotheradius2.zip
	sed -i "s/ITR1/ITR2/g" index.js
	sed -i "s/Into The Radius/Into the Radius 2/g" index.js
	sed -i "s/Into The Radius/Into The Radius 2/g" info.json
	sed -i "s/IntoTheRadius/IntoTheRadius2/g" index.js
	sed -i "s/intotheradiusvr/intotheradius2/g" index.js
	sed -i "s/1012790/2307350/g" index.js
	7z a game-intotheradius2.zip index.js info.json assets/

.PHONY: all clean
