// Nexus Mods domain for the game. e.g. nexusmods.com/bloodstainedritualofthenight
const GAME_ID = 'intotheradius2';
const STEAMAPP_ID = '2307350';
const path = require('path');
const { fs, log, util } = require('vortex-api');

// Valid extensions for mods
const VALID_EXTENSIONS = ['.pak', '.utac', '.ucas', '.lua'];

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
		queryModPath: () => 'IntoTheRadius2/Content/Paks/Mods',
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
	const modDir = path.join(discovery.path, 'IntoTheRadius2', 'Content', 'Paks', 'Mods');
	await fs.ensureDirWritableAsync(modDir);

	const binariesDir = path.join(discovery.path, 'IntoTheRadius2', 'Binaries', 'Win64');
	await fs.ensureDirWritableAsync(binariesDir);

	// Copy over required UE4SS files
	const filesToCopy = [
		{ src: path.join(__dirname, 'assets', 'dwmapi.dll'), dest: path.join(binariesDir, 'dwmapi.dll') },
		{ src: path.join(__dirname, 'assets', 'UE4SS-settings.ini'), dest: path.join(binariesDir, 'UE4SS-settings.ini') },
		{ src: path.join(__dirname, 'assets', 'UE4SS.dll'), dest: path.join(binariesDir, 'UE4SS.dll') }
	];

	for (const file of filesToCopy) {
		await copyFile(file.src, file.dest);
	}
}

module.exports = {
	default: main,
};