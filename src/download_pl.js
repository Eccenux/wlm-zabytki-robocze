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
	"southWest":{"lng":13.863917, "lat":48.487486}, 
	"northEast":{"lng":24.487697, "lat":55.422779},
}

const loader = new MonumentsLoader(boundaries.southWest.lat, boundaries.northEast.lat);
loader.loadMany(boundaries);