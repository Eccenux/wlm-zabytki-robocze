/**
 * Geo calculation.
 *
 * Original scripts and formulas explanation: http://www.movable-type.co.uk/scripts/latlong.html
 *
 * Note: lat/lon format should be passed to functions in degrees as a float (positive or negative).
 * latitude: N+/S- (pl: szerokość geograficzna)
 * longitude: E+/W- (pl: długość geograficzna)
 * e.g 15.123S, 50.123E -> -15.123, 50.123
 *
 * @author Chris Veness 2002-2012
 * @author Maciej Nux Jaros 2013-2014
 *
 * Licensed under (at ones choosing)
 *   <li>MIT License: http://www.opensource.org/licenses/mit-license
 *   <li>or CC-BY: http://creativecommons.org/licenses/by/3.0/
 */
export function GeoCalc() {
}

/**
 * Converts degrees to radians.
 * @param {Number} degrees
 * @returns {Number}
 */
GeoCalc.toRad = function(degrees) {
	return degrees * Math.PI / 180;
};

/**
 * Converts radians to degrees.
 * @param {Number} radians
 * @returns {Number}
 */
GeoCalc.toDeg = function(radians) {
	return radians * 180 / Math.PI;
};

/**
 * Distance calculted with haversine formula.
 *
 * <pre>
 * a = sin²(Δφ/2) + cos(φ1).cos(φ2).sin²(Δλ/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c
 * </pre>
 *
 * @param {Number} lat1 Float in degrees (as others).
 * @param {Number} lon1
 * @param {Number} lat2
 * @param {Number} lon2
 * @returns {Number} Distance in km.
 */
GeoCalc.distanceWithHaversine = function(lat1, lon1, lat2, lon2) {
	var R = 6371; // km
	var dLat = GeoCalc.toRad(lat2-lat1);
	var dLon = GeoCalc.toRad(lon2-lon1);
	lat1 = GeoCalc.toRad(lat1);
	lat2 = GeoCalc.toRad(lat2);

	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
			+ Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
};

/**
 * Bearing (forward azimuth).
 * 
 * θ = atan2( sin(Δλ).cos(φ2), cos(φ1).sin(φ2) − sin(φ1).cos(φ2).cos(Δλ) )
 *
 * @param {Number} lat1 Float in degrees (as others).
 * @param {Number} lon1
 * @param {Number} lat2
 * @param {Number} lon2
 * @returns {Number} Distance in km.
 */
GeoCalc.bearing = function(lat1, lon1, lat2, lon2) {
	var dLon = GeoCalc.toRad(lon2-lon1);
	lat1 = GeoCalc.toRad(lat1);
	lat2 = GeoCalc.toRad(lat2);

	var y = Math.sin(dLon) * Math.cos(lat2);
	var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
	return GeoCalc.toDeg(Math.atan2(y, x));
};