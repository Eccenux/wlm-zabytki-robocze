// Import necessary modules
import pgPromise from "pg-promise";
import dbConfig from "./dbConfig.priv.js";
import Log from "../Log.js";
import fs from 'fs';

// Define the SQL query
// const sqlQuery = fs.readFileSync('./src/db/find.dupl.sql');
const sqlLimit = 50;
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
const aggSeparator = '; ';
const sqlQuery = /* sql */`
select concat(lat_, ':' , lon_) as latlon
	, max(townLabel) as town
	, max(stateLabel) as state
	, count(*) as rowCount
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

	/**
	 * Dump top sqlLimit rows as an MW table.
	 */
	async top() {
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
			const wikitable = this.formatAsTable(result);
			const wiki = `== TOP ${sqlLimit} ==\n${wikitable}`;

			// Write the MediaWiki table to a file
			const output = 'output.wiki';
			fs.writeFileSync(output, wiki);

			console.log(`Wikitable with %d base row(s) saved to ${output}`, result.length);
		} catch (error) {
			console.error('Error dumping data to MediaWiki table:', error);
		}
	}

	/** @private */
	formatAsTable(rows) {
		let table = '{| class="topalign"\n';
		const headers = Object.keys(rows[0]).filter((h)=>h in sqlNameMap);
		const headerNames = headers.map((h)=>sqlNameMap[h]);
		table += '! ' + headerNames.join(' !! ') + '\n';

		for (const row of rows) {
			// const aggCount = row['rowCount'].split(aggSeparator).length;
			const aggCount = row['rowcount'];
			// init row 1st
			table += '\n|-';
			// add non-agg with rowspan
			let values, column;
			values = this.transformMain(row, headers);
			column = `\n| rowspan=${aggCount} | `;
			table += column + values.join(column);
			// transform aggregate values
			let aggs = this.transformAggregates(row, headers);
			// append 0-row aggs without rowspan
			column = `\n| `;
			values = this.shiftValues(aggs);
			table += column + values.join(column);
			// add other aggs as rows
			while (aggs[0].length) {
				table += '\n|-';
				values = this.shiftValues(aggs);
				table += column + values.join(column);
			}
		}

		table += '\n|}\n';
		return table;
	}

	/** @private Get 0-th item from each sub-array (modifies agg!). */
	shiftValues(aggs) {
		const values = [];
		for (let index = 0; index < aggs.length; index++) {
			values.push(aggs[index].shift());
		}
		return values;
	}

	/** @private Main columns. */
	transformMain(row, headers) {
		return headers
				.filter(h=>!h.startsWith('agg_'))
				.map((header) => {
					if (header === 'latlon') {
						const ll = row[header];
						return `[https://zabytki.toolforge.org/#!?c=${ll}:20 mapa]`;
					}
					return row[header];
				})
		;
	}

	/** @private Aggregated columns. */
	transformAggregates(row, headers) {
		return headers
				.filter(h=>h.startsWith('agg_'))
				.map((header) => {
					const isQ = (header === 'agg_qid');
					return row[header]
						.split(aggSeparator)
						.map(v=>{
							if (!v.length) {
								return '-';
							}
							if (!isQ) {
								return v;
							}
							return `[[wikidata:Q${v}|Q${v}]]`;
						})
				})
		;
	}
}