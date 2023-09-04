// Node v14-18; Postgres v10-15.
import pgPromise from "pg-promise";
import dbConfig from "./dbConfig.priv.js";

export default class DbData {
	constructor() {
		this.initDone = false;
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
	 * @param {Object} data WD record.
	 * @returns 
	 */
	async insert(data) {
		if (this.initDone === false) {
			this.init();
		}
		const query = `
			INSERT INTO wlz_dupl (lat, lon, itemLabel, townLabel, item, town)
			VALUES ($<coord.lat>, $<coord.lon>, $<itemLabel>, $<townLabel>, $<item>, $<town>)
			RETURNING id;
		`;

		const result = await this.db.one(query, data);
		// console.log(result, 'done');
		return result;
	}

	/**
	 * Check if record exists.
	 * @param {Object} data WD record.
	 * @returns count of records found.
	 */
	async exists(data) {
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

		const count = await this.db.one(query, data);
		return parseInt(count.num, 10);
	}
}
