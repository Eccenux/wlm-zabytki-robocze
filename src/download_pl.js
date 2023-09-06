/**
 * Download Polish monuments.
 */

import { MonumentsLoader } from "./MonumentsLoader.js";

/*
	Polska.

	Test:
	https://w.wiki/7M9G
*/
const boundaries = {
	"southWest":{"lng":14.09002, "lat":48.87194},
	"northEast":{"lng":24.19078, "lat":54.88292},
}

const loader = new MonumentsLoader(boundaries.southWest.lat, boundaries.northEast.lat);
// test batch
loader.loadMany(boundaries);
// full
// loader.loadMany(boundaries, -1);