import { GeoCalc } from "./GeoCalc.js";

/** Formatowanie na metry/km. */
const format = (distance) => {
	if (distance < 0.00000001)	return {j:'nm', d:(distance*1000*1000000).toFixed(6)};
	if (distance < 0.00001)		return {j:'mm', d:(distance*1000*1000).toFixed(8)};
	if (distance < 0.01)		return {j:'m',  d:(distance*1000).toFixed(10)};
	return {j:'km', d:(distance).toFixed(12)};
};
const formatDiff = (diff) => {
	if (diff == 0)	return diff;
	if (diff <= 2e-4)	return diff.toExponential();
	return diff;
};

/**
 * Dokładność geolokalizacji vs dystans.
 * 
 * Czyli zasadniczo jak wpływa dokładność podajnej lokalizacji na dokładność w metrach (lub kilometrach).
 * 
 * Uwaga! Choć metoda obliczania odległości (Haversine) jest bardzo dokładna,
 * to dokładność obliczeń na float w JS może jednak wprowadzać znaczące zakłócenia.
 * Wyniki liczbowe powinny jednak dawać przyzwoite oszacowanie dokładności.
 */
function dist (opt) {
	let {latFun, lonFun} = opt;
	console.log("dystans wg Δ\tjedn.\tΔlat\tΔlon");
	for(let i = 13; i >= 1; i--) {
		let diffLat = latFun(i);
		let diffLon = lonFun(i);
		let lat2=lat1+diffLat;
		let lon2=lon1+diffLon;
		
		// Distance in km
		let distance = GeoCalc.distanceWithHaversine(lat1, lon1, lat2, lon2);
		let {j, d} = format(distance);
		console.log("%s\t%s\t%s\t%s", d, j, formatDiff(diffLat), formatDiff(diffLon));
	}
	console.log("\n\n");
}

//~środek Polski
let lat1=52.2556682736455;
let lon1=19.1697782736455;

dist({latFun:(i)=>1/10**i, lonFun:()=>0});
dist({latFun:()=>0, lonFun:(i)=>1/10**i});

// check reduction of both
const reduceAccuracy = (d) => d.toFixed(5);
let lat2 = reduceAccuracy(lat1);
let lon2 = reduceAccuracy(lon1);
console.log('before: %f => after: %f', lat1, lat2);
console.log('before: %f => after: %f', lon1, lon2);

let distance = GeoCalc.distanceWithHaversine(lat1, lon1, lat2, lon2);
let {j, d} = format(distance);
console.log("%s %s", d, j);
