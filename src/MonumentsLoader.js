import { downAccuracy, ceilAccuracy } from './MapHelpers.js';
import fs from 'fs';
import path from 'path';
/**
 * Download monuments.
 */
export class MonumentsLoader {
	/**
	 * @param {Number} lat1 range.
	 * @param {Number} lat2 range.
	 */
	constructor(lat1, lat2) {
		this.lat1 = downAccuracy(lat1, 2);
		this.lat2 = ceilAccuracy(lat2, 2);
	}

	/**
	 * Load many in boundaries.
	 */
	async loadMany(boundaries, max = 3) {
		let lon1 = boundaries.southWest.lng;
		let limiter = () => false;
		if (max > 0) {
			limiter = () => {
				max--;
				if (max <= 0) {
					return true;
				}
				return false;
			}
		}
		const step = 0.005;
		let steps = 0;
		const qids = new Set();
		let total = 0;
		for (let lon2 = lon1 + step; lon2 < boundaries.northEast.lng; lon1 = lon2, lon2 += step) {
			steps++;
			let re = await this.load(lon1, lon2);
			const digits = 4;
			const rangeInfo = `${downAccuracy(lon1, digits)}, ${ceilAccuracy(lon2, digits)}`
			// let re = [];
			if (!re.length) {
				console.log('No records found (%s).', rangeInfo);
				continue;
			}
			total += re.length;
			console.log('Saving %d records (%s).', re.length, rangeInfo);
			// remeber Qids
			re.forEach((r)=>{
				qids.add(r.item);
			})
			// save records
			this.saveRecords(re, {lon1, lon2});
			// optional limit
			if (limiter()) {
				break;
			}
		}
		// save Qids
		this.saveData(Array.from(qids), '_qids.json');
		// summary
		console.log('Done in %d steps', steps);
		console.log('Total records: %d; Qids: %d.', total, qids.size);
	}

	/**
	 * Save monument records.
	 * @param {Array} re 
	 * @param {Object} params 
	 */
	saveRecords(re, params) {
		const mul = Math.pow(10, 4);
		const trans = (l) => Math.floor(l*mul);
		const name = `lon_${trans(params.lon1)}_${trans(params.lon2)}.json`;
		this.saveData(re, name);
	}

	/**
	 * Save data.
	 * @param {Array|Object} data 
	 * @param {Object} params 
	 */
	saveData(data, name) {
		const outputDir = './output';
		const outputFile = path.join(outputDir, name);

		// Create the output directory if it doesn't exist
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir);
		}

		// Write the data to the file
		fs.writeFileSync(outputFile, JSON.stringify(data, null, '\t'));
	}

	/**
	 * Load monuments in range.
	 * @param lon1raw Start (smaller)
	 * @param lon2raw End
	 */
	async load(lon1raw, lon2raw) {
		const lat1 = this.lat1;
		const lat2 = this.lat2;
		const lon1 = downAccuracy(lon1raw, 3);
		const lon2 = ceilAccuracy(lon2raw, 3);

		// Polska: ?item wdt:P17 wd:Q36 .
		const query = `
			SELECT ?item ?itemLabel ?town ?townLabel ?image ?coord ?category WHERE {
				SERVICE wikibase:box {
				?item wdt:P625 ?coord. hint:Prior hint:rangeSafe true.
				bd:serviceParam 
					wikibase:cornerWest "Point(${lon1} ${lat1})"^^geo:wktLiteral;
					wikibase:cornerEast "Point(${lon2} ${lat2})"^^geo:wktLiteral.
				}
				OPTIONAL { ?item wdt:P625 ?coord. }
				OPTIONAL { ?item wdt:P131 ?town. }
				OPTIONAL { ?item wdt:P18 ?image. }
				?item wdt:P17 wd:Q36 .
				?item p:P1435 ?monument.
				OPTIONAL { ?item wdt:P31 ?type. }
				OPTIONAL { ?item wdt:P373 ?category. }
				SERVICE wikibase:label { bd:serviceParam wikibase:language "pl,en". }
			}
		`;
		// return Promise.resolve(query);

		const re = await fetch("https://query.wikidata.org/sparql?query=" + encodeURIComponent(query), {
			"credentials": "omit",
			"headers": {
				"Accept": "application/json, text/plain, */*",
				"Sec-Fetch-Dest": "empty",
				"Sec-Fetch-Mode": "cors",
				"Sec-Fetch-Site": "cross-site",
			},
			"referrer": "https://zabytki.toolforge.org/",
			"method": "GET",
			"mode": "cors"
		});

		const data = await re.json();
		return this.constructor.transform(data);
	}

	static entityUriRe = /.+\/Q/;
	static entityUriToQ(property) {
		if (!property?.value) {
			return undefined;
		}
		return property.value.replace(this.entityUriRe, 'Q');
	}
	static coordsTransform(property) {
		let lat, lon;
		let value = property?.value;
		if (value) {
			value.replace(/Point\s*\(([0-9.]+) ([0-9.]+)\)/, (a, x, y) => {
				lon = x;
				lat = y;
			});
		}
		return {lat, lon};
	}

	/** API record to lite record. */
	static recordTransform(r) {
		return {
			category : r?.category?.value,
			coord : this.coordsTransform(r.coord),
			itemLabel : r?.itemLabel?.value,
			townLabel : r?.townLabel?.value,
			image : r?.image?.value,
			item : this.entityUriToQ(r.item),
			town : this.entityUriToQ(r.town),
		};
	}

	/** Make the JSON lite. */
	static transform(data) {
		let records = data.results.bindings;
		return records.map((r) => this.recordTransform(r));
	}
}
