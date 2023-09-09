/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */
/* global mw */

/**
 * Wikidata API notes.
 * 
 * Replacing a property:
 * 1. Read claim-id by property name with wbgetentities.
 * 2. Removed claim by id with wbremoveclaims.
 * 3. Add a new value with wbcreateclaim.
 */

/**
 * Action wbgetentities.
 * 
 * Gets snaks, hashes, ids, ranks...
 */
var api = new mw.Api();
var req = api.postWithToken('csrf', {
	action: 'wbgetentities',
		ids: 'Q30049941',
	})
	.done(function (re) {
		console.log(`code: ${re.code}, success: ${re.success}`, re);
	})
	.fail(function (re) {
		console.warn(re);
	})
;
// Example response (fragment)
// re.entieties.Q30049941.claims (skipped other claims)
var claims = {
	"P625": [{
		"mainsnak": {
			"snaktype": "value",
			"property": "P625",
			"hash": "f63f75010629fa142d8a888915da9c501080c987",
			"datavalue": {
				"value": {
					"latitude": 51.170424,
					"longitude": 16.146997,
					"altitude": null,
					"precision": 0.000001,
					"globe": "http://www.wikidata.org/entity/Q2"
				},
				"type": "globecoordinate"
			},
			"datatype": "globe-coordinate"
		},
		"type": "statement",
		"id": "Q30049941$85F585DF-67B7-45DB-B888-A42BDB1AE872",
		"rank": "normal",
		"references": [{"hash":"09da3d268c7002d247162927091b2c7232f94abc","snaks":{"P143":[{"snaktype":"value","property":"P143","hash":"dc559468322de29cd9e7f5acac72ab26ee9d5fce","datavalue":{"value":{"entity-type":"item","numeric-id":28563569,"id":"Q28563569"},"type":"wikibase-entityid"},"datatype":"wikibase-item"}],"P813":[{"snaktype":"value","property":"P813","hash":"ef513b51539a71c1bf144a02f5613d88ab533924","datavalue":{"value":{"time":"+2017-03-08T00:00:00Z","timezone":0,"before":0,"after":0,"precision":11,"calendarmodel":"http://www.wikidata.org/entity/Q1985727"},"type":"time"},"datatype":"time"}]},"snaks-order":["P143","P813"]}]
	}]
}

/**
 * Remove property with wbremoveclaims.
 */
var api = new mw.Api();
var claimId = 'Q30049941$85F585DF-67B7-45DB-B888-A42BDB1AE872';
var req = api.postWithToken('csrf', {
	action: 'wbremoveclaims',
		claim: claimId,
	})
	.done(function (re) {
		// should have re.success = 1
		console.log(`code: ${re.code}, success: ${re.success}`, re);
	})
	.fail(function (re) {
		// re.code / re.info
		console.warn(re);
	})
;

/**
 * Add property with wbcreateclaim.
 * P625 = lat: 51.170230459745, lon: 16.146803039764.
 */
var api = new mw.Api();
var ll = {
	lat: 51.170230459745,
	lon: 16.146803039764
};
var req = api.postWithToken('csrf', {
		action: 'wbcreateclaim',
		entity: 'Q30049941',
		property: 'P625',
		snaktype: 'value',
		value: JSON.stringify({
			"latitude": ll.lat,
			"longitude": ll.lon,
			"globe": "http://www.wikidata.org/entity/Q2",	// Earth
			"precision": 1e-6	// 1e-6 is accurate to ~0.1 meters in Poland (10 cm)
		})
	})
	.done(function (re) {
		console.log(`code: ${re.code}, success: ${re.success}`, re);
	})
	.fail(function (re, r2, r3, r4) {
		//debugger;
		console.warn(re, {
			code: r2?.error?.code,
			info: r2?.error?.info,
			warn: JSON.stringify(r2?.warnings)
		});
	})
;
