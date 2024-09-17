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
	await Promise.all([
		fs.ensureDirWritableAsync(path.join(pakDir, "Mods")),
		fs.ensureDirWritableAsync(path.join(pakDir, "LogicMods")),
		fs.ensureDirWritableAsync(path.join(pakDir, "LuaMods")),
		fs.ensureDirWritableAsync(binDir),
	]);


	// Copy over required UE4SS files
	const filesToCopy = [
		{ src: path.join(__dirname, 'assets', 'override.txt'), dest: path.join(discovery.path, binDir, 'override.txt') },
	];

	for (const file of filesToCopy) {
		await copyFile(file.src, file.dest);
	}
	log('debug', "[ITR2] [INSTALL] Copied required files");
}

function isFomod(files) {
	if (files.some(f => path.basename(f) === 'moduleconfig.xml')) {
		log('debug', "[ITR2] [INSTALL] Detected FOMOD");
		return true;
	}
	return false;
}

// Mods can either be a UE4SS Lua mod, a UE4SS Blueprint mod, or a pak mod.
function testSupportedContent(files, gameId) {
	log('debug', "[ITR2] [INSTALL] Testing supported content");
	// If it's not ITR2, it's already unsupported.
	if ((GAME_NEXUS_ID !== gameId) || isFomod(files)) {
		return Promise.resolve({
			supported: false,
			requiredFiles: [],
		});
	}

	let isLuaMod = false;

	// iterate over all folders at root to check if it's a Lua mod
	let hasMainlua = files.some(f => path.basename(f) === 'main.lua');
	let hasEnabledtxt = files.some(f => path.basename(f) === 'enabled.txt');
	let hasShared = files.some(f => path.basename(f) === 'shared');

	if ((hasMainlua && hasEnabledtxt) || hasShared) {
		isLuaMod = true;
	}


	// If a file ends with .pak, it's either a BP or pak mod.
	let isPakMod = files.some(f => path.extname(f).toLowerCase() === '.pak');

	// Special case for UE4SS (it doesn't have the enabled.txt files)
	let isUE4SS = files.some(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss');

	let isCustomFormat = files.some(f => path.basename(f) === 'custom-full.txt') || files.some(f => path.basename(f) === 'custom.txt');

	if (isUE4SS) {
		log('debug', "[ITR2] [INSTALL] Supported content [UE4SS]");
	}
	if (isLuaMod) {
		log('debug', "[ITR2] [INSTALL] Supported content [LUA]");
	}
	if (isPakMod) {
		log('debug', "[ITR2] [INSTALL] Supported content [PAK]");

	}
	if (isCustomFormat) {
		log('debug', "[ITR2] [INSTALL] Supported content [CUSTOM]");
	}

	if (!isUE4SS && !isLuaMod && !isPakMod && !isCustomFormat) {
		log('debug', "[ITR2] [INSTALL] Unsupported content");
	}
	return Promise.resolve({
		supported: isUE4SS || isLuaMod || isPakMod || isCustomFormat,
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

	// Check if either 'custom.txt' or 'custom-full.txt' exists, and handle the copy process
	const customFile = files.find(f => ['custom.txt', 'custom-full.txt'].includes(path.basename(f)));

	if (customFile) {
		log('debug', "[ITR2] [CUSTOM] Mod defined itself as a custom-format mod");

		for (let f of files) {
			if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase()) || path.basename(f) === 'custom-format.txt') continue;
			const destination = path.basename(customFile) === 'custom.txt' ? path.join(pakDir, f) : f;
			instructions.push({
				type: 'copy',
				source: f,
				destination: destination,  // Handle destination paths
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

	let luaModDir = '';
	let luaSharedCopy = false;
	let luaModName = '';

	for (let f of files) {
		// Skip files that do not have valid extensions
		if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;
		log('debug', `[ITR2] [INSTALL] Checking ${f}`);

		// Determine Lua Mod Name based on directory structure (if applicable)
		const fileDir = path.dirname(f);
		const baseDir = path.basename(fileDir);
		log('debug', `[ITR2] [INSTALL] Base directory: ${baseDir}`);
		log('debug', `[ITR2] [INSTALL] File directory: ${fileDir}`);

		// Check if the file is inside a LuaMods or related directory
		if (['luamods', 'luamod'].includes(baseDir.toLowerCase())) {
			luaModName = path.basename(path.dirname(fileDir));  // Mod name is the parent folder of LuaMods
		} else {
			luaModName = baseDir;  // Use the current folder as mod name if it's not under LuaMods
		}

		// Check for 'enabled.txt'
		if (path.basename(f) === 'enabled.txt') {
			luaModDir = fileDir;
			log('debug', `[ITR2] [LUA] ${f} to ${path.join('LuaMods', luaModName, 'enabled.txt')}`);
			instructions.push(
				{
					type: 'copy',
					source: path.join(luaModDir, 'enabled.txt'),
					destination: path.join(pakDir, 'LuaMods', luaModName, 'enabled.txt'),
				},
				{
					type: 'copy',
					source: path.join(luaModDir, 'Scripts'),
					destination: path.join(pakDir, 'LuaMods', luaModName, 'Scripts'),
				}
			);
			continue;
		}

		if ((path.basename(fileDir) === 'shared') && (path.extname(f).toLowerCase() === '.lua') && !luaSharedCopy) {
			luaSharedCopy = true;

			if (luaModName === 'shared') {
				const parentFolder = path.basename(path.dirname(fileDir));
				luaModName = parentFolder === '' ? 'ITR2-Common' : parentFolder;
			}

			log('debug', `[ITR2] [LUA] ${f} to ${path.join('LuaMods', 'shared', luaModName)}`);
			instructions.push({
				type: 'copy',
				source: path.dirname(f),
				destination: path.join(pakDir, 'LuaMods', 'shared', luaModName),
			});
			continue;
		}

		// Handle .pak, .ucas, .utoc files for LogicMods and Mods
		if (['.pak', '.ucas', '.utoc'].includes(path.extname(f).toLowerCase())) {
			let parentFolder = path.basename(path.dirname(f));
			let modName;

			if (parentFolder === 'LogicMods') {
				modName = path.basename(path.dirname(path.dirname(f)));
				log('debug', `[ITR2] [BP] ${f} to ${path.join("LogicMods", modName, path.basename(f))}`);
				instructions.push({
					type: 'copy',
					source: f,
					destination: path.join(pakDir, "LogicMods", modName, path.basename(f)),
				});
			} else {
				modName = path.basename(path.dirname(f));
				log('debug', `[ITR2] [PAK] ${f} to ${path.join("Mods", modName, path.basename(f))}`);
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