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
		queryModPath: () => './',
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
	log('debug', "[ITR2] [INSTALL] Preparing for modding");
	await fs.ensureDirWritableAsync(path.join(pakDir, "Mods"));
	await fs.ensureDirWritableAsync(path.join(pakDir, "LogicMods"));
	await fs.ensureDirWritableAsync(path.join(pakDir, "LuaMods"));
	await fs.ensureDirWritableAsync(binDir);

	// Copy over required UE4SS files
	const filesToCopy = [
		{ src: path.join(__dirname, 'assets', 'override.txt'), dest: path.join(discovery.path, binDir, 'override.txt') },
	];

	for (const file of filesToCopy) {
		await copyFile(file.src, file.dest);
	}
	log('debug', "[ITR2] [INSTALL] Copied required files");
}



// Mods can either be a UE4SS Lua mod, a UE4SS Blueprint mod, or a pak mod.
function testSupportedContent(files, gameId) {
	log('debug', "[ITR2] [INSTALL] Testing supported content");
	// If it's not ITR2, it's already unsupported.
	if (GAME_NEXUS_ID !== gameId) {
		return Promise.resolve({
			supported: false,
			requiredFiles: [],
		});
	}

	let isLuaMod = false;

	// iterate over all folders at root to check if it's a Lua mod
	for (let f of files) {
		// Only copy files that are among the valid extensions.
		if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;

		if (path.basename(f) === 'main.lua' && (path.basename(path.dirname(f)) === 'Scripts' || path.basename(path.dirname(f)) === 'scripts')) {
			const modFolder = path.dirname(path.dirname(f));
			const enabledTxt = path.join(modFolder, 'enabled.txt');

			if (files.includes(enabledTxt)) {
				isLuaMod = true;
				break;
			}
		}
	}

	// If a file ends with .pak, it's either a BP or pak mod.
	let isPakMod = files.some(f => path.extname(f).toLowerCase() === '.pak');

	// Special case for UE4SS (it doesn't have the enabled.txt files)
	let isUE4SS = files.some(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss');

	if (isUE4SS || isLuaMod || isPakMod) {
		log('debug', "[ITR2] [INSTALL] Supported content");
	} else {
		log('debug', "[ITR2] [INSTALL] Unsupported content");
	}
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

	log('debug', "[ITR2] [INSTALL] Files:", files);

	// if ./custom-format.txt exists, move it to the root directory
	if (files.some(f => path.basename(f) === 'custom-format.txt')) {
		log('debug', "[ITR2] [CUSTOM] Mod defined itself as a custom-format mod");
		for (let f of files) {
			if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase()) || path.basename(f) === 'custom-format.txt') continue;
			instructions.push({
				type: 'copy',
				source: f,
				destination: path.join(pakDir,f),
			});
		}
		return Promise.resolve({ instructions });
	}


	// Check if ./ue4ss/UE4SS.dll exists
	if (files.some(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss')) {
		log('debug', "[ITR2] [UE4SS] Copying UE4SS.dll, UE4SS-settings.ini, and Mods to root directory");
		instructions.push(
			{
				type: 'copy',
				source: files.find(f => path.basename(f) === 'dwmapi.dll'),
				destination: path.join(binDir, 'dwmapi.dll'),
			},
			{
				type: 'copy',
				source: files.find(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss'),
				destination: path.join(pakDir, 'UE4SS.dll'),
			},
			{
				type: 'copy',
				source: files.find(f => path.basename(f) === 'UE4SS-settings.ini' && path.dirname(f) === 'ue4ss'),
				destination: path.join(pakDir, 'UE4SS-settings.ini'),
			},
			{
				type: 'copy',
				source: files.find(f => path.basename(f) === 'Mods' && path.dirname(f) === 'ue4ss'),
				destination: path.join(pakDir, 'LuaMods'),
			}
		);
		return Promise.resolve({ instructions });
	}

	// Check if it's a Lua mod by checking `./Scripts/main.lua` and `./enabled.txt`, if so, move all files to `LuaMods`
	let isLuaMod = false;
	let luaModDir = '';

	for (let f of files) {
		// Only copy files that are among the valid extensions.
		if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;

		if (path.basename(f) === 'main.lua' && (path.basename(path.dirname(f)) === 'Scripts' || path.basename(path.dirname(f)) === 'scripts')) {
			const modFolder = path.dirname(path.dirname(f));
			const enabledTxt = path.join(modFolder, 'enabled.txt');

			if (files.includes(enabledTxt)) {
				isLuaMod = true;
				luaModDir = modFolder;
				break;
			}
		}
	}

	if (isLuaMod) {
		// Copy all files from Scripts to LuaMods/ModName/Scripts in the same path
		log('debug', "[ITR2] [Lua] Copying Lua mod files to LuaMods");
		for (let f of files) {
			if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;
			const modName = path.basename(luaModDir);
			instructions.push(
				{
					type: 'copy',
					source: path.join(luaModDir, 'enabled.txt'),
					destination: path.join(pakDir, 'LuaMods', modName, 'enabled.txt'),
				},
				{
					type: 'copy',
					source: path.join(luaModDir, 'Scripts'),
					destination: path.join(pakDir, 'LuaMods', modName, 'Scripts'),
				}
			);
		}
		return Promise.resolve({ instructions });
	}

	// Handle Blueprint and Pak mods
	for (let f of files) {
		if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;

		if (['.pak', '.ucas', '.utoc'].includes(path.extname(f).toLowerCase())) {
			let parentFolder = path.basename(path.dirname(f));
			let modName = path.basename(path.dirname(parentFolder === 'LogicMods' ? path.dirname(f) : f));

			if ('LogicMods' === parentFolder) {
				log('debug', `[ITR2] [BP] ${f} to ${path.join("LogicMods", modName, path.basename(f))}`);
				// Blueprint mod
				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join(pakDir, "LogicMods", modName, path.basename(f)),
				});
			} else {
				log('debug', `[ITR2] [PAK] ${f} to ${path.join("Mods", modName, path.basename(f))}`);
				// Pak mod
				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join(pakDir, "Mods", modName, path.basename(f)),
				});
			}
		}
	}

	return Promise.resolve({ instructions });
}

module.exports = {
	default: main,
	installContent,
	testSupportedContent,
};