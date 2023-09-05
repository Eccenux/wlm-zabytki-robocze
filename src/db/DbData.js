// Node v14-18; Postgres v10-15.
import pgPromise from "pg-promise";
import dbConfig from "./dbConfig.priv.js";
import Log from "../Log.js";

export default class DbData {
	constructor() {
		this.initDone = false;
		const dt = new Date().toISOString().replace(/:/g, '.');
		this.log = new Log(`./output/${dt}--dbdata.log`);
	}
	/** @private init */
	init() {
		// Initialize pg-promise
		this.pgp = pgPromise();
		// Create a database instance with the connection details
		this.db = this.pgp(dbConfig);
		// Done
		this.initDone = true;
	}
	/**
	 * Insert WD data into the database.
	 * @param {Object} dump WD record.
	 * @returns 
	 */
	async insert(dump) {
		if (this.initDone === false) {
			this.init();
		}
		const query = `
			INSERT INTO wlz_dupl (lat, lon, itemLabel, townLabel, item, town)
			VALUES ($<coord.lat>, $<coord.lon>, $<itemLabel>, $<townLabel>, $<item>, $<town>)
			ON CONFLICT DO NOTHING
			RETURNING id;
		`;

		// clone and unify
		const data = {
			"coord": {
				"lat": dump?.coord?.lat,
				"lon": dump?.coord?.lon,
			},
			"itemLabel": dump?.itemLabel ?? '',
			"townLabel": dump?.townLabel ?? '',
			"item": dump.item.replace('Q',''),
			"town": (dump?.town ?? '-1').replace('Q',''),
		}

		this.coordTransform(data);	// floor coord (unify for select)
		let result;
		try {
			result = await this.db.one(query, data);
		} catch (error) {
			if (!error.message.startsWith('No data')) {
				const info = `[ERROR] Failed insert of Q${data.item} (${data.coord.lat}, ${data.coord.lon}), ${data.itemLabel}:`;
				console.error(info);
				this.log.log(info);
				this.log.log(error.toString());
			}
			result = false;
		}
		// console.log(result, 'done');
		return result;
	}

	/** @private */
	coordTransform(data) {
		data.coord.lon = this.trimSingleCoord(data.coord.lon);
		data.coord.lat = this.trimSingleCoord(data.coord.lat);
	}
	/** @private */
	trimSingleCoord(ll) {
		return ll.replace(/(\.\d{8})\d+/, '$1');
	}

	/**
	 * Check if record exists.
	 * @param {Object} dump WD record.
	 * @returns count of records found.
	 */
	async exists(dump) {
		if (this.initDone === false) {
			this.init();
		}
		const query = `
			SELECT count(*) as num FROM wlz_dupl
			WHERE 
				item = $<item>
				AND lat = cast($<coord.lat> as NUMERIC(11, 8))
				AND lon = cast($<coord.lon> as NUMERIC(11, 8))
			;
		`;

		const data = {
			"coord": {
				"lat": dump?.coord?.lat,
				"lon": dump?.coord?.lon,
			},
			"item": dump.item.replace('Q',''),
		}
		this.coordTransform(data);	// floor coord (unify)
		const count = await this.db.one(query, data);
		return parseInt(count.num, 10);
	}
}
