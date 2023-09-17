// Node v14-18; Postgres v10-15.
import pgPromise from "pg-promise";
const QueryFile = pgPromise.QueryFile;
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
	 * Re-creates the table.
	 */
	async createTable() {
		if (this.initDone === false) {
			this.init();
		}
		const path = './db/CREATE_wlz_dupl.sql';
		const file = new QueryFile(path);
		await this.db.manyOrNone(file);
	}

	/**
	 * Insert WD data into the database.
	 * @param {Object} dump WD record.
	 * @returns false if insert failed.
	 */
	async insert(dump) {
		if (this.initDone === false) {
			this.init();
		}
		const query = /* sql */`
			INSERT INTO wlz_dupl (lat, lon
				, item
				, itemLabel
				, townLabel
				, stateLabel
				, typeLabels
				, inspireIds
				, monumentStatus
				, hasPart
				, isPartOf
				, otherThen
				, street
			)
			VALUES ($<coord.lat>, $<coord.lon>
				, $<item>
				, $<itemLabel>
				, $<townLabel>
				, $<stateLabel>
				, $<typeLabels>
				, $<inspireIds>
				, $<monumentStatus>
				, $<hasPart>
				, $<isPartOf>
				, $<otherThen>
				, $<street>
			)
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
			"stateLabel": dump?.stateLabel ?? '',
			"inspireIds": dump?.inspireIds ?? '',
			"monumentStatus": dump?.monumentStatus ?? '',
			"hasPart": dump?.hasPart ?? '',
			"isPartOf": dump?.isPartOf ?? '',
			"otherThen": dump?.otherThen ?? '',
			"street": dump?.street ?? '',
			"typeLabels": dump?.types ?? '',
			"item": dump.item.replace('Q',''),
			// "town": (dump?.town ?? '-1').replace('Q',''),
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
		const query = /* sql */`
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
