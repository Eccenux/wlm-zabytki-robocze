/**
 * Download Polish monuments.
 */

import { MonumentsLoader } from "./MonumentsLoader.js";

/*
	Polska: 
	wikibase:cornerWest "Point(13.86 48.49)"^^geo:wktLiteral;
	wikibase:cornerEast "Point(24.49 55.42)"^^geo:wktLiteral.
*/
const boundaries = {
	"southWest":{"lng":13.86391785, "lat":48.48748647}, 
	"northEast":{"lng":24.48769714, "lat":55.42277902},
}
const loader = new MonumentsLoader(boundaries.southWest.lat, boundaries.northEast.lat);
async function load() {
	let lon1 = boundaries.southWest.lng;
	let lon2 = lon1 + 0.005;
	let re = await loader.load(lon1, lon2);
	console.log(re);
}
load();