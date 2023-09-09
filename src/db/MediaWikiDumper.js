// Import necessary modules
import pgPromise from "pg-promise";
import dbConfig from "./dbConfig.priv.js";
import Log from "../Log.js";
import fs from 'fs';
import path from 'path';
import FileRemover from "../FileRemover.js";

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
	'agg_item': 'etykieta',
	'agg_other': 'inne niż',
	'agg_street': 'ulica',
}
const aggSeparator = ' ;; ';
const sqlQuery = /* sql */`
select concat(lat_, ':' , lon_) as latlon
	, max(townLabel) as town
	, lower(max(stateLabel)) as state
	, count(*) as rowCount
	, count(distinct item) as cnt
	, array_to_string(array_agg(item ORDER BY item), '${aggSeparator}') as agg_qid
	, array_to_string(array_agg(inspireIds ORDER BY item), '${aggSeparator}') as agg_inspireid
	, array_to_string(array_agg(otherThen ORDER BY item), '${aggSeparator}') as agg_other
	, array_to_string(array_agg(typeLabels ORDER BY item), '${aggSeparator}') as agg_type
	, array_to_string(array_agg(monumentStatus ORDER BY item), '${aggSeparator}') as agg_status
	, array_to_string(array_agg(itemLabel ORDER BY item), '${aggSeparator}') as agg_item
	, array_to_string(array_agg(street ORDER BY item), '${aggSeparator}') as agg_street
from (
	SELECT cast(lat as NUMERIC(11,6)) as lat_, cast(lon as NUMERIC(11,6)) as lon_
	, item
	, itemLabel
	, townLabel
	, stateLabel
	, inspireIds
	, typeLabels
	, monumentStatus
	, otherThen
	, street
	FROM public.wlz_dupl
) as t
group by lat_, lon_
`;
const wikiSectionHeader = /* xml */`
<templatestyles src="Nux/wlz-duplikaty.css"/>
<templatestyles src="Nux/szeroka-tabela.css"/>
<div class="tpl--wlz-duplikaty-off wide-wikitable sticky-top">
Uwaga! Na mapie WLZ wyświetlają się wyłączenie zabytki ze statusem „zabytek nieruchomy”. Przyjmujemy, że powinno być tak:
* status „zabytek nieruchomy” – zabytek jest w wojewódzkim rejestrze zabytków nieruchomych (czyli np. budynki, a nie wykopaliska);
* status „zabytek w Polsce” – zabytek jest w innej ewidencji (np. ewidencji gminnej, albo jest zabytkiem ruchomym).
W tabelach są wszystkie zabytki (wszystko co ma status dobra kultury i ma współrzędne). Zakładamy, że część statusów może być nieprawidłowa (i trzeba je poprawić).
`;
const wikiSectionFooter = /* xml */`
</div>
`;

/**
 * Dump query as a MediaWiki table.
 */
export default class MediaWikiDumper {
	constructor() {
		this.initDone = false;
		const dt = new Date().toISOString().replace(/:/g, '.');
		this.log = new Log(`./output/${dt}--db2mw.log`);

		this.topBound = 4;
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
			const sql = `${sqlQuery}
				having count(distinct item) > ${this.topBound}
				order by cnt desc
				limit ${sqlLimit}
			`;
			const result = await this.db.many(sql);
			if (!Array.isArray(result)) {
				throw "Unexpected result";
			}

			// Format the result as a MediaWiki table
			const wikitable = this.formatAsTable(result, sqlNameMap);
			const count = result.length;
			let wiki = `== TOP ==\nTop${count} (najwięcej powtórznych lokalizacji)\n`;
			wiki += wikiSectionHeader;
			wiki += wikitable;
			wiki += wikiSectionFooter;

			// Write the MediaWiki table to a file
			const output = 'output_top.wiki';
			fs.writeFileSync(output, wiki);

			console.log(`Wikitable with %d base row(s) saved to ${output}`, result.length);
		} catch (error) {
			console.error('Error dumping data to MediaWiki table:', error);
		}
	}

	/**
	 * Dump ~all by state.
	 */
	async states() {
		if (this.initDone === false) {
			this.init();
		}
		try {
			// Execute the SQL query
			const sql = `${sqlQuery}
				having count(distinct item) > 1
				AND	count(distinct item) <= ${this.topBound}
				order by state, town, latlon, cnt desc
			`;
			const result = await this.db.many(sql);
			if (!Array.isArray(result)) {
				throw "Unexpected result";
			}

			const outputDir = './output/mw/';

			// Clear output
			const remover = new FileRemover();
			await remover.removeFiles(outputDir, /woj.+\.wiki/);

			// Save by states
			const stateMap = this.splitBytState(result);
			const states = Object.keys(stateMap);
			const info = {
				list : [],
				include : [],
				total : 0,
			};
			for (const state of states) {
				const rows = stateMap[state];
				if (!state.length) {
					console.warn('Skipping empty state name with %d row(s).', rows.length);
					continue;
				}
			
				// Format state data as a MediaWiki table
				const nameMap = { ...sqlNameMap }
				delete nameMap.state;	// remove state from table (section already has this)
				const wikitable = this.formatAsTable(rows, nameMap);
				let wiki = `== ${state} ==\n`;
				wiki += wikiSectionHeader;
				wiki += wikitable;
				wiki += wikiSectionFooter;
			
				// Write the MediaWiki table to a file
				const safeState = this.safeState(state);
				const output = `${safeState}.wiki`;
				fs.writeFileSync(path.join(outputDir, output), wiki);

				// info
				console.log(`Wikitable with %d base row(s) saved to ${output}`, rows.length);
				const title = this.constructor.pageTitle(output); 
				info.total += rows.length;
				info.list.push(`* [[${title}|${state}]] (${rows.length}).`);
				info.include.push(`{{${title}}}`);
			}

			// // merge files
			// const fileMerger = new FileMerger(outputDir);
			// const filterWikiFiles = (file) => file.startsWith('woj') && file.endsWith('.wiki');
			// fileMerger.mergeFiles('output_woj.wiki', filterWikiFiles);

			// summary/includes
			fs.writeFileSync('output_states_list.wiki', info.list.join('\n'));
			fs.writeFileSync('output_states_all.wiki', info.include.join('\n'));
			console.log('Summary: %d files with %d base rows.', info.list.length, info.total);
		} catch (error) {
			console.error('Error dumping data to MediaWiki table:', error);
		}
	}

	static pageTitle(file) {
		const subtitle = file.replace('.wiki', ''); // Remove extension
		return `Wikipedysta:NuxBot/WLZ_duplikaty/${subtitle}`;
	}
	
	/** @private Make a state name safe for a file. */
	safeState(state) {
		const safeState = this.translitPolish(state)
			.replace(/^woje\S+/i, 'woj')
			.replace(/[^a-z]+/g, '_')
		;
		return safeState;
	}

	/** @private Replace Polish characters */
	translitPolish(text) {
		return text
			.replace(/ą/g, 'a')
			.replace(/ć/g, 'c')
			.replace(/ę/g, 'e')
			.replace(/ł/g, 'l')
			.replace(/ń/g, 'n')
			.replace(/ó/g, 'o')
			.replace(/ś/g, 's')
			.replace(/ż/g, 'z')
			.replace(/ź/g, 'z')
			.replace(/Ą/g, 'A')
			.replace(/Ć/g, 'C')
			.replace(/Ę/g, 'E')
			.replace(/Ł/g, 'L')
			.replace(/Ń/g, 'N')
			.replace(/Ó/g, 'O')
			.replace(/Ś/g, 'S')
			.replace(/Ż/g, 'Z')
			.replace(/Ź/g, 'Z')
		;
	}

	/** @private */
	splitBytState(rows) {
		// Create an object to store data grouped by state
		const stateMap = {};
		rows.forEach((row) => {
			const { state } = row;
			// If the state doesn't exist in the stateMap, create an empty array for it
			if (!stateMap[state]) {
				stateMap[state] = [];
			}
			// Push the row data into the corresponding state's array
			stateMap[state].push(row);
		});
		return stateMap;
	}

	/** @private */
	formatAsTable(rows, nameMap) {
		let table = '{| class="topalign"\n';
		const headers = Object.keys(rows[0]).filter((h)=>h in nameMap);
		const headerNames = headers.map((h)=>nameMap[h]);
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

	/** @private */
	escape(value) {
		return value.replace(/\|/g, '⏐');	// avoid breaking wikitable
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
					return this.escape(row[header]);
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
						.map(v=>this.escape(v))
						.split(aggSeparator)
						.map(v=>{
							if (!v.length) {
								return '-';
							}
							if (header === 'agg_inspireid') {
								return this.vInspire(v);
							}
							if (!isQ) {
								return v;
							}
							return `[[wikidata:Q${v}|Q${v}]]`;
						})
				})
		;
	}

	/** @private */
	vInspire(v) {
		return v
			.split(',')
			.map(id=>id.trim())
			.map(id=>`[https://zabytek.pl/pl/obiekty/zabytek?rejestr=rejestr-zabytkow&inspire_id=${id} ${id}]`)
			.join(', ')
		;
	}	
}