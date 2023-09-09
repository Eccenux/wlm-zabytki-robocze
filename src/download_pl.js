/**
 * Download Polish monuments.
 */
import process from 'node:process';
import { MonumentsLoader } from "./MonumentsLoader.js";
import FileRemover from './FileRemover.js';

/*
	Polska.

	Test:
	https://w.wiki/7M9G
*/
const boundaries = {
	"southWest":{"lng":14.09002, "lat":48.87194},
	"northEast":{"lng":24.19078, "lat":54.88292},
}
// Legnica
// "southWest":{"lng":16.10, "lat":51.15},
// "northEast":{"lng":16.18, "lat":51.23},

try {
	const outputDir = './output';

	const remover = new FileRemover();
	await remover.removeFiles(outputDir, /lon_.+.json/);

	const loader = new MonumentsLoader(boundaries.southWest.lat, boundaries.northEast.lat, outputDir);

	// test batch
	// await loader.loadMany(boundaries);
	// full
	await loader.loadMany(boundaries, -1);
} catch (error) {
	console.error(error);
	process.exit(500);	// ext code / %errorlevel%
}
