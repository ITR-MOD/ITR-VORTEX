const path = require('path');
const { fs, log, util, handlers } = require('vortex-api');

const GAME_ID = 'intotheradius2';
const STEAMAPP_ID = '2307350';
const VALID_EXTENSIONS = ['.pak', '.utac', '.ucas', '.lua'];

var pakDir = path.join('IntoTheRadius2', 'Content', 'Paks');
var binDir = path.join('IntoTheRadius2', 'Binaries', 'Win64');

function findGame() {
	return util.GameStoreHelper.findByAppId(STEAMAPP_ID)
		.then(game => game.gamePath);
}

function main(context) {
	context.registerGame({
		id: GAME_ID,
		name: 'Into the Radius 2',
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
			SteamAPPId: STEAMAPP_ID,
		},
		details: {
			steamAppId: STEAMAPP_ID,
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
	// Ensure the mod is for the correct game and contains valid files
	const supported = gameId === GAME_ID &&
		(files.some(file => VALID_EXTENSIONS.includes(path.extname(file).toLowerCase())) ||
			files.some(file => path.basename(file).toLowerCase() === 'ue4ss.dll'));

	return Promise.resolve({
		supported,
		requiredFiles: [],
	});
}

function installContent(files) {
	// Determine if UE4SS.dll is in any of the files' root directories
	const hasUE4SSDLL = files.some(file => {
		const fileName = path.basename(file).toLowerCase();
		return fileName === 'ue4ss.dll' && path.dirname(file) === '.';
	});

	// Set the installation directory based on the presence of UE4SS.dll
	const destinationDir = hasUE4SSDLL ? "./" : "/Mods";

	// Create installation instructions
	const instructions = files.map(file => {
		// Remove leading directories from file paths, keep only the file name
		const fileName = path.basename(file);
		return {
			type: 'copy',
			source: file,
			destination: path.join(destinationDir, fileName),
		};
	});

	return Promise.resolve({ instructions });
}


module.exports = {
	default: main,
	testSupportedContent,
	installContent,
};