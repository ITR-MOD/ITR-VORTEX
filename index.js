const path = require('path');
const { fs, log, util, handlers } = require('vortex-api');

const GAME_NEXUS_ID = 'intotheradius2';
const GAME_STEAM_ID = '2307350';
const GAME_NAME = 'Into the Radius 2'
const VALID_EXTENSIONS = ['.pak', '.utoc', '.ucas', '.lua', '.ini', '.txt', '.dll'];

var pakDir = path.join('IntoTheRadius2', 'Content', 'Paks');
var binDir = path.join('IntoTheRadius2', 'Binaries', 'Win64');

function findGame() {
	return util.GameStoreHelper.findByAppId(STEAMAPP_ID)
		.then(game => game.gamePath);
}

function main(context) {
	context.registerGame({
		id: GAME_NEXUS_ID,
		name: GAME_NAME,
		mergeMods: true,
		queryPath: findGame,
		supportedTools: [],
		queryModPath: () => 'IntoTheRadius2/Content/Paks',
		logo: 'assets/gameart.jpg',
		executable: () => 'IntoTheRadius2.exe',
		requiredFiles: [
			'IntoTheRadius2.exe'
		],
		setup: prepareForModding,
		environment: {
			SteamAPPId: GAME_STEAM_ID,
		},
		details: {
			steamAppId: GAME_STEAM_ID,
		},
	});
	context.registerInstaller('intotheradius2-mod', 25, testSupportedContent, installContent);
	return true;
}

async function copyFile(source, destination) {
	return new Promise((resolve, reject) => {
		const readStream = fs.createReadStream(source);
		const writeStream = fs.createWriteStream(destination);

		readStream.on('error', reject);
		writeStream.on('error', reject);
		writeStream.on('finish', resolve);

		readStream.pipe(writeStream);
	});
}

async function prepareForModding(discovery) {

	await fs.ensureDirWritableAsync(path.join(pakDir, "Mods"));
	await fs.ensureDirWritableAsync(path.join(pakDir, "LogicMods"));
	await fs.ensureDirWritableAsync(path.join(pakDir, "LuaMods"));
	await fs.ensureDirWritableAsync(binDir);

	// Copy over required UE4SS files
	const filesToCopy = [
		{ src: path.join(__dirname, 'assets', 'dwmapi.dll'), dest: path.join(discovery.path, binDir, 'dwmapi.dll') },
		{ src: path.join(__dirname, 'assets', 'override.txt'), dest: path.join(discovery.path, binDir, 'override.txt') },
	];

	for (const file of filesToCopy) {
		await copyFile(file.src, file.dest);
	}
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
	let isUE4SS = files.some(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss');

	return Promise.resolve({
		supported: isUE4SS || isLuaMod || isPakMod,
		requiredFiles: [],
	});
}

// For UE4SS Lua mods / UE4SS:
// Move all files (that are not .pak files) from the directory where the Mods folder is located in, to IntoTheRadius2\Binaries\Win64
// For UE4SS BP mods:
// Move all .pak files that are located inside a LogicMods folder, to IntoTheRadius2\Content\Paks\LogicMods
// For Pak mods:
// Move all .pak files that are not located inside a Logic Mods folder, to IntoTheRadius2\Content\Paks
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

		if ('.pak'  === path.extname(f).toLowerCase() ||
			'.ucas' === path.extname(f).toLowerCase() ||
			'.utoc' === path.extname(f).toLowerCase()) {
			let parentFolder = path.basename(path.dirname(f));

			if ('LogicMods' === parentFolder) {
				// Blueprint mod
				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join("LogicMods", path.basename(f)),
				});
			} else {
				// Pak mod
				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join("Mods", path.basename(f)),
				});
			}
		} else {
			// Lua mod
			if (!isLuaMod || idx == null) continue;

			instructions.push({
				type: 'copy',
				source: f,
				destination: path.join("LuaMods", path.join(f.substr(idx))),
			});
		}
	}

	return Promise.resolve({ instructions });
}

module.exports = {
	default: main,
};