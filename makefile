default: itr1-vortex itr2-vortex

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

clean:
	-rm -f game-intotheradius2-vortex.zip
	-rm -f game-intotheradiusvr-vortex.zip

.PHONY: all clean
