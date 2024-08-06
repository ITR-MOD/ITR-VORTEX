const path = require('path');
const { fs, log, util } = require('vortex-api');

const GAME_NEXUS_ID = 'madeinabyssbinarystarfallingintodarkness';
const GAME_NAME = 'Made in Abyss: Binary Star Falling into Darkness';
const GAME_STEAM_ID = '1324340';

const VALID_EXTENSIONS = ['.pak', '.txt', '.dll', '.ini', '.lua'];

function main(context) {
	context.registerGame({
		id: GAME_NEXUS_ID,
		name: GAME_NAME,
		mergeMods: true,
		queryPath: findGame,
		supportedTools: [],
		queryModPath: () => '.',
		logo: 'gameart.jpg',
		executable: () => 'MadeInAbyss.exe',
		requiredFiles: [
		  'MadeInAbyss.exe',
		  'MadeInAbyss-BSFD/Binaries/Win64/MadeInAbyss-Win64-Shipping.exe',
		],
		setup: prepareForModding,
		environment: {
		  SteamAPPId: GAME_STEAM_ID,
		},
		details: {
		  steamAppId: GAME_STEAM_ID,
		},
	});

	context.registerInstaller('miabsfd-mod', 25, testSupportedContent, installContent);
	
	return true;
}

// The game is only available to be modded on Steam
function findGame() {
	return util.GameStoreHelper.findByAppId(GAME_STEAM_ID).then(game => game.gamePath);
}

// Directories where we'll be placing files
async function prepareForModding(discovery) {
	await fs.ensureDirWritableAsync(path.join(discovery.path, 'MadeInAbyss-BSFD', 'Content', 'Paks'));
	await fs.ensureDirWritableAsync(path.join(discovery.path, 'MadeInAbyss-BSFD', 'Content', 'Paks', 'LogicMods'));
	await fs.ensureDirWritableAsync(path.join(discovery.path, 'MadeInAbyss-BSFD', 'Binaries', 'Win64', 'Mods'));
}

// Mods can either be a UE4SS Lua mod, a UE4SS Blueprint mod, or a pak mod.
function testSupportedContent(files, gameId) {
	// If it's not MiABSFD, it's already unsupported.
	if (GAME_NEXUS_ID !== gameId) {
		return Promise.resolve({
			supported: false,
			requiredFiles: [],
		});
	}

	let isLuaMod = false;

	// Check if UE4SS Lua mod:
	// Both Mods/*/Scripts/main.lua and Mods/*/enabled.txt must exist
	let luaMainFile = files.find(
		f => path.basename(f) === 'main.lua' &&
		path.basename(path.dirname(f)) === 'Scripts' &&
		path.basename(path.dirname(path.dirname(path.dirname(f)))) === 'Mods'
	);
	if (luaMainFile) {
		const modFolder = path.dirname(path.dirname(luaMainFile));

		const enabledTxt = path.join(modFolder, 'enabled.txt');

		isLuaMod = files.includes(enabledTxt);
	}

	// If a file ends with .pak, it's either a BP or pak mod.
	let isPakMod = files.some(f => path.extname(f).toLowerCase() === '.pak');

	// Special case for UE4SS (it doesn't have the enabled.txt files)
	let isUE4SS = files.some(f => path.basename(f) === 'UE4SS.dll');

	return Promise.resolve({
		supported: isUE4SS || isLuaMod || isPakMod,
		requiredFiles: [],
	});
}

// For UE4SS Lua mods / UE4SS:
// Move all files (that are not .pak files) from the directory where the Mods folder is located in, to MadeInAbyss-BSFD\Binaries\Win64
// For UE4SS BP mods:
// Move all .pak files that are located inside a LogicMods folder, to MadeInAbyss-BSFD\Content\Paks\LogicMods
// For Pak mods:
// Move all .pak files that are not located inside a Logic Mods folder, to MadeInAbyss-BSFD\Content\Paks
function installContent(files) {
	let instructions = [];

	const isLuaMod = files.some(f => path.basename(f) === 'main.lua');
	let idx;
	if (isLuaMod) {
		const modFolder = files.find(f => path.basename(f) === 'Mods')
		idx = modFolder.indexOf(path.basename(modFolder));
	}

	for (let f of files) {
		// Only copy files that are among the valid extensions.
		// Fixes the "not part of the archive" error.
		if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;

		if ('.pak' === path.extname(f).toLowerCase()) {
			let parentFolder = path.basename(path.dirname(f));

			if ('LogicMods' === parentFolder) {
				// Blueprint mod

				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join("MadeInAbyss-BSFD", "Content", "Paks", "LogicMods", path.basename(f)),
				});
			} else {
				// Pak mod

				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join("MadeInAbyss-BSFD", "Content", "Paks", path.basename(f)),
				});
			}
		} else {
			// Lua mod
			if (!isLuaMod || idx == null) continue;

			instructions.push({
				type: 'copy',
				source: f,
				destination: path.join("MadeInAbyss-BSFD", "Binaries", "Win64", path.join(f.substr(idx))),
			});
		}
	}

	return Promise.resolve({ instructions });
}

module.exports = {
    default: main,
};