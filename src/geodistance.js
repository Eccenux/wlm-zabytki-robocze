import { GeoCalc } from "./GeoCalc.js";

/** Formatowanie na metry/km. */
const format = (distance) => {
	return distance < 0.5 ? {j:'m', d:(distance*1000).toFixed(10)} : {j:'km', d:(distance).toFixed(8)};
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
	console.log("dystans\tjednostka\tdokładność lat\tdokładność lon");
	for(let i = 13; i >= 1; i--) {
		let diffLat = latFun(i);
		let diffLon = lonFun(i);
		let lat2=lat1+diffLat;
		let lon2=lon1+diffLon;
		
		// Distance in km
		let distance = GeoCalc.distanceWithHaversine(lat1, lon1, lat2, lon2);
		let {j, d} = format(distance);
		console.log("%s\t%s\t%f\t%f", d, j, diffLat, diffLon);
	}
	console.log("\n\n");
}

//~środek Polski
let lat1=52.2556612131415;
let lon1=19.1697712131415;

dist({latFun:(i)=>1/10**i, lonFun:()=>0});
dist({latFun:()=>0, lonFun:(i)=>1/10**i});
