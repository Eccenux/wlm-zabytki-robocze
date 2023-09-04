// Node v14-18; Postgres v10-15.
import pgPromise from "pg-promise";
import dbConfig from "./dbConfig.priv.js";

export default class DbData {
	constructor() {
		this.initDone = false;
	}
	init() {
		// Initialize pg-promise
		this.pgp = pgPromise();
		// Create a database instance with the connection details
		this.db = this.pgp(dbConfig);
		// Done
		this.initDone = true;
	}
	// Function to insert data into the database
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
		console.log(result, 'done');
		return result;
	}
}
