// Import necessary modules
import pgPromise from "pg-promise";
import dbConfig from "./dbConfig.priv.js";
import Log from "../Log.js";
import fs from 'fs';

// Define the SQL query
// const sqlQuery = fs.readFileSync('./src/db/find.dupl.sql');
const sqlQuery = `
select concat(lat_, ':' , lon_) as latlon
	, max(townLabel) as miasto
	, max(stateLabel) as woj
	, count(distinct item) as licznik
	, array_to_string(array_agg(item ORDER BY item), '; ') as "Q (duplikaty lub złe współrzędne)"
	, array_to_string(array_agg(inspireIds ORDER BY item), '; ') as "inspire id"
	, array_to_string(array_agg(typeLabels ORDER BY item), '; ') as typy
	, array_to_string(array_agg(monumentStatus ORDER BY item), '; ') as statusy
from (
	SELECT cast(lat as NUMERIC(11,6)) as lat_, cast(lon as NUMERIC(11,6)) as lon_
	, item
	, townLabel
	, stateLabel
	, inspireIds
	, typeLabels
	, monumentStatus
	FROM public.wlz_dupl
) as t
group by lat_, lon_
having count(distinct item) > 2
order by licznik desc
limit 20
`;

/**
 * Dump query as a MediaWiki table.
 */
export default class MediaWikiDumper {
	constructor() {
		this.initDone = false;
		const dt = new Date().toISOString().replace(/:/g, '.');
		this.log = new Log(`./output/${dt}--db2mw.log`);
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

	async dumpToMediaWikiTable() {
		if (this.initDone === false) {
			this.init();
		}
		try {
			// Execute the SQL query
			const result = await this.db.many(sqlQuery);
			if (!Array.isArray(result)) {
				throw "Unexpected result";
			}

			// Format the result as a MediaWiki table
			const wikitable = this.formatAsMediaWikiTable(result);

			// Write the MediaWiki table to a file
			fs.writeFileSync('output.wiki', wikitable);

			console.log('MediaWiki table has been written to output.wiki');
		} catch (error) {
			console.error('Error dumping data to MediaWiki table:', error);
		}
	}

	/** @private */
	formatAsMediaWikiTable(rows) {
		let table = '{| class="wikitable topalign"\n';
		const headers = Object.keys(rows[0]);
		table += '! ' + headers.join(' !! ') + '\n';

		for (const row of rows) {
			const values = headers
				.map((header) => {
					if (header === 'latlon') {
						const ll = row[header];
						return `[https://zabytki.toolforge.org/#!?c=${ll}:20 ${ll}]`;
					}
					return row[header]
						.split('; ')
						.map(v=>v.length?v:'-')
						.join('<br>')
				})
			;
			table += '\n|-\n| ' + values.join('\n| ');
		}

		table += '\n|}\n';
		return table;
	}
}