const path = require('path');
const { fs, log, util, handlers } = require('vortex-api');

const GAME_NEXUS_ID = 'intotheradius2';
const GAME_STEAM_ID = '2307350';
const GAME_NAME = 'Into the Radius 2';
const VALID_EXTENSIONS = ['.pak', '.utoc', '.ucas', '.lua', '.ini', '.txt', '.dll'];

// Commonly used directories for mod files
var pakDir = path.join('IntoTheRadius2', 'Content', 'Paks');
var binDir = path.join('IntoTheRadius2', 'Binaries', 'Win64');

function findGame() {
	return util.GameStoreHelper.findByAppId(GAME_STEAM_ID)
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
		logo: 'assets/ITR2.jpg',
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

/**
 * Utility function to copy a file from a source path to a destination path.
 * Needed because Vortex API lacks this functionality.
 */
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
	log('debug', "[ITR2] [SETUP] Preparing for modding");

	// Ensure writable directories exist for mods
	await Promise.all([
		fs.ensureDirWritableAsync(path.join(pakDir, "Mods")),
		fs.ensureDirWritableAsync(path.join(pakDir, "LogicMods")),
		fs.ensureDirWritableAsync(path.join(pakDir, "LuaMods")),
		fs.ensureDirWritableAsync(binDir),
	]);

	// Copy required files to the game's binaries directory
	const filesToCopy = [
		{ src: path.join(__dirname, 'assets', 'override.txt'), dest: path.join(discovery.path, binDir, 'override.txt') },
	];

	for (const file of filesToCopy) {
		await copyFile(file.src, file.dest);
	}
	log('debug', "[ITR2] [SETUP] Copied required files");
}

/**
 * Checks if the provided files include a FOMOD configuration.
 * @param {string[]} files - List of files in the mod package.
 * @returns {boolean} True if the mod contains a FOMOD.
 */
function isFomod(files) {
	if (files.some(f => path.basename(f) === 'moduleconfig.xml')) {
		log('debug', "[ITR2] [SUPPORT] Detected FOMOD");
		return true;
	}
	return false;
}

/**
 * Determines if the provided content is supported by this game extension.
 * Checks for specific file types and structures, such as .pak, .lua, or UE4SS mods.
 * @param {string[]} files - List of files in the mod package.
 * @param {string} gameId - The game ID to match against.
 * @returns {Promise<Object>} Supported status and required files.
 */
function testSupportedContent(files, gameId) {
	log('debug', "[ITR2] [SUPPORT] Testing supported content");

	// Skip unsupported games or FOMOD configurations
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
	let isUE4SS = files.some(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss');
	let isCustomFormat = files.some(f => path.basename(f) === 'custom-full.txt') || files.some(f => path.basename(f) === 'custom.txt');

	// Log the detected type of supported content
	if (isUE4SS) log('debug', "[ITR2] [SUPPORT] Supported content [UE4SS]");
	if (isLuaMod) log('debug', "[ITR2] [SUPPORT] Supported content [LUA]");
	if (isPakMod) log('debug', "[ITR2] [SUPPORT] Supported content [PAK]");
	if (isCustomFormat) log('debug', "[ITR2] [SUPPORT] Supported content [CUSTOM]");

	return Promise.resolve({
		supported: isUE4SS || isLuaMod || isPakMod || isCustomFormat,
		requiredFiles: [],
	});
}

/**
 * Installs the provided mod files into the appropriate directories.
 * Handles various mod types, such as Lua mods, PAK mods, and UE4SS mods.
 * @param {string[]} files - List of files in the mod package.
 * @returns {Promise<Object>} Installation instructions.
 */
function installContent(files) {
	let instructions = [];
	let alreadyCopied = [];
	log('debug', "[ITR2] [INSTALL] Files:", files);

	// Handle custom mod format
	const customFiles = files.filter(f => path.basename(f) === 'custom.txt');
	for (const customFile of customFiles) {
		const customDir = path.dirname(customFile);
		const customDirFiles = files.filter(f => path.dirname(f) === customDir);

		for (const file of customDirFiles) {
			if (!alreadyCopied.includes(file)) {
				if (path.basename(file) === 'custom.txt') {
					continue;
				}
				instructions.push({
					type: 'copy',
					source: file,
					destination: path.join(file),
				});
				alreadyCopied.push(file);
			}
		}
	}

	// Handle UE4SS mods
	if (files.some(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss')) {
		log('debug', "[ITR2] [INSTALL] Copying UE4SS.dll, UE4SS-settings.ini, and Mods to root directory");
		instructions.push(
			{ type: 'copy', source: files.find(f => path.basename(f) === 'dwmapi.dll'), destination: path.join(binDir, 'dwmapi.dll') },
			{ type: 'copy', source: files.find(f => path.basename(f) === 'UE4SS.dll' && path.dirname(f) === 'ue4ss'), destination: path.join(pakDir, 'UE4SS.dll') },
			{ type: 'copy', source: files.find(f => path.basename(f) === 'UE4SS-settings.ini' && path.dirname(f) === 'ue4ss'), destination: path.join(pakDir, 'UE4SS-settings.ini') },
			{ type: 'copy', source: files.find(f => path.basename(f) === 'Mods' && path.dirname(f) === 'ue4ss'), destination: path.join(pakDir, 'LuaMods') }
		);
		return Promise.resolve({ instructions });
	}

	let luaModDir = '';
	let luaSharedCopy = false;
	let luaModName = '';

	for (let f of files) {
		if (!VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;

		if (alreadyCopied.includes(f)) {
			log('debug', `[ITR2] [INSTALL] Skipping already copied file: ${f}`);
			continue;
		}

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
