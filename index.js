const path = require('path');
const { fs, log, util, handlers } = require('vortex-api');

const GAME_NEXUS_ID = 'intotheradius2';
const GAME_STEAM_ID = '2307350';
const GAME_NAME = 'Into the Radius 2'
const VALID_EXTENSIONS = ['.pak', '.utac', '.ucas', '.lua'];

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


function testSupportedContent(files, gameId) {
	if (GAME_NEXUS_ID !== gameId) {
		return Promise.resolve({
			supported: false,
			requiredFiles: [],
		});
	}

	let isUE4SS = files.some(file => path.basename(file).toLowerCase() === 'ue4ss')

	// Check if UE4SS Lua mod:
	// Both LuaMods/*/Scripts/main.lua and LuaMods/*/enabled.txt must exist
	let isLuaMod = false;
	let luaMainFile = files.find(
		f => path.basename(f) === 'main.lua' &&
			path.basename(path.dirname(f)) === 'Scripts' &&
			path.basename(path.dirname(path.dirname(f))) !== 'LuaMods' &&
			path.basename(path.dirname(path.dirname(path.dirname(f)))) === 'LuaMods'
	);
	if (luaMainFile) {
		const modFolder = path.dirname(path.dirname(luaMainFile));
		const enabledTxt = path.join(modFolder, 'enabled.txt');
		isLuaMod = files.includes(enabledTxt);
	}

	// If a file ends with .pak, it's either a BP or pak mod.
	let isPakMod = files.some(f => path.extname(f).toLowerCase() === '.pak');

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

	let isUE4SS = files.some(file => file.toLowerCase() === 'ue4ss.dll' || file.toLowerCase().startsWith('ue4ss/'));
	log('isUE4SS:', isUE4SS);
	for (let f of files) {
		// Only copy files that are among the valid extensions.
		// Fixes the "not part of the archive" error.
		if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;

		// Handle UE4SS files
		if (isUE4SS) {
			// copy ./ue4ss.dll or ue4ss/ue4ss.dll to pakDir
			if (path.basename(f).toLowerCase() === 'ue4ss.dll' || path.basename(f).toLowerCase() === 'ue4ss-settings.ini') {
				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join(pakDir, path.basename(f)),
				});
			} else if (path.basename(f) === 'Mods') {
				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join(pakDir, 'LuaMods'),
				});
			}
		} else {
			// Handle PAK
			if ('.pak' === path.extname(f).toLowerCase() || 
				'.ucas' === path.extname(f).toLowerCase() || 
				'.utoc' === path.extname(f).toLowerCase()) {
				// if the pak is in a LogicMods folder, copy it to the LogicMods folder
				if (path.basename(path.dirname(f)) === 'LogicMods' ||  
					path.basename(path.dirname(path.dirname(f))) === 'LogicMods') {
					instructions.push({
						type: 'copy',
						source: f,
						destination: path.join("LogicMods", path.basename(f)),
					});
				} else {
					// otherwise, copy it to the Paks folder
					instructions.push({
						type: 'copy',
						source: f,
						destination: path.join("Mods", path.basename(f)),
					});
				}
			} else {
				// Lua mod
				if (path.basename(f) === 'main.lua' && 
					(path.basename(path.dirname(f)) === 'Scripts' || 
					path.basename(path.dirname(f)) === 'scripts')) {
					instructions.push({
						type: 'copy',
						source: f,
						destination: path.join(pakDir, "LuaMods", path.basename(f)),
					});
				}
			}
		}
	}

	// Add console logging
	log('installContent instructions:', instructions);

	return Promise.resolve({ instructions });
}

module.exports = {
	default: main,
	testSupportedContent,
	installContent,
};