// Import necessary modules
import pgPromise from "pg-promise";
import dbConfig from "./dbConfig.priv.js";
import Log from "../Log.js";
import fs from 'fs';

// Define the SQL query
// const sqlQuery = fs.readFileSync('./src/db/find.dupl.sql');
const sqlLimit = 10;
const sqlNameMap = {
	'latlon': 'lokalizacja',
	'town': 'miasto',
	'state': 'woj.',
	'cnt': 'licznik',
	'agg_qid': 'Q (duplikat lub złe współrzędne)',
	'agg_inspireid': 'inspire id',
	'agg_type': 'typ obiektu',
	'agg_status': 'status dobra kultury',
}
const sqlQuery = `
select concat(lat_, ':' , lon_) as latlon
	, max(townLabel) as town
	, max(stateLabel) as state
	, count(distinct item) as cnt
	, array_to_string(array_agg(item ORDER BY item), '; ') as agg_qid
	, array_to_string(array_agg(inspireIds ORDER BY item), '; ') as agg_inspireid
	, array_to_string(array_agg(typeLabels ORDER BY item), '; ') as agg_type
	, array_to_string(array_agg(monumentStatus ORDER BY item), '; ') as agg_status
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
order by cnt desc
limit ${sqlLimit}
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
		let table = '{| class="topalign"\n';
		const headers = Object.keys(rows[0]);
		const headerNames = headers.map((h)=>sqlNameMap[h]);
		table += '! ' + headerNames.join(' !! ') + '\n';

		/**
		 * TODO: better tables.
		 * ✅mark column as agg_(regate)
		 * rowspan = count rows in any agg_
		 * add non-agg with rowspan
		 * add 0-row agg without rowspan
		 * add other agg as rows
		 */
		for (const row of rows) {
			const values = headers
				.map((header) => {
					if (header === 'latlon') {
						const ll = row[header];
						return `[https://zabytki.toolforge.org/#!?c=${ll}:20 ${ll}]`;
					}
					const isQ = (header === 'agg_qid');
					return row[header]
						.split('; ')
						.map(v=>{
							if (!v.length) {
								return '-';
							}
							if (!isQ) {
								return v;
							}
							return `[[wikidata:Q${v}|Q${v}]]`;
						})
						.join('<br>')
				})
			;
			table += '\n|-\n| ' + values.join('\n| ');
		}

		table += '\n|}\n';
		return table;
	}
}