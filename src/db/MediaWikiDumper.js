// Import necessary modules
import pgPromise from "pg-promise";
import dbConfig from "./dbConfig.priv.js";
import Log from "../Log.js";
import fs from 'fs';
import path from 'path';
import FileRemover from "../FileRemover.js";

// Define the SQL query
// const sqlQuery = fs.readFileSync('./src/db/find.dupl.sql');
const sqlLimit = 100;
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
	// 'agg_other': 'inne niż',
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
	, array_to_string(array_agg(hasPart ORDER BY item), '${aggSeparator}') as agg_haspart
	, array_to_string(array_agg(isPartOf ORDER BY item), '${aggSeparator}') as agg_ispartof
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
	, hasPart
	, isPartOf
	, otherThen
	, street
	FROM public.wlz_dupl
	where typeLabels !~ 'nieistniejący'
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

        /** Number of repeated locations that gets into top. */
		this.topBound = 3;
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
				having count(distinct item) >= ${this.topBound}
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
			let wiki = `== TOP ==\n__NOTOC__\nTop${count} (najwięcej powtórznych lokalizacji)\n`;
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
	 * Dump groups with unique inspire id.
	 */
	async listInspired() {
		if (this.initDone === false) {
			this.init();
		}
		try {
			// Execute the SQL query
			const sql = `${sqlQuery}
				having count(distinct item) >= 2
				order by cnt desc
			`;
			const result = await this.db.many(sql);
			if (!Array.isArray(result)) {
				throw "Unexpected result";
			}

			// filter rows
			const filteredRows = result.filter(row=>this.inspiredRow(row));

			// Format the result as a MediaWiki table
			const wikitable = this.formatAsTable(filteredRows, sqlNameMap);
			const count = filteredRows.length;
			let wiki = `== Inspirowane ==\n__NOTOC__\n[${count}] (grupy pełne inspire id)\n`;
			wiki += wikiSectionHeader;
			wiki += wikitable;
			wiki += wikiSectionFooter;

			// Write the MediaWiki table to a file
			const output = 'output_inspire.wiki';
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
				AND	count(distinct item) < ${this.topBound}
				order by state, town, latlon, cnt desc
			`;
			const result = await this.db.many(sql);
			if (!Array.isArray(result)) {
				throw "Unexpected result";
			}

			const outputDir = './output/mw/';
			// create
			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, { recursive: true });
			}
	
			// Clear output
			const remover = new FileRemover();
			await remover.removeFiles(outputDir, /woj.+\.wiki/);

			// filter rows
			const filteredRows = result.filter(row=>this.showRow(row));

			// Save by states
			const stateMap = this.splitBytState(filteredRows);
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
		if (typeof value === 'string') {
			return value.replace(/\|/g, '⏐');	// avoid breaking wikitable
		}
		return value;
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
					return this.escape(row[header])
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
	showRow(row) {
		let show = this.showRowByInspire(row);
		if (show) {
			show = this.showRowByParts(row);
			if (show) {
				show = this.showRowByPartOf(row);
			}
		}
		return show;
	}
	/**
	 * Check if row should go into the table (by inspire id).
	 * 
	 * This is for checking if work on the row is not done yet.
	 * 
	 * Don't show groups that all have iid and all iid are unique.
	 * So also any empty iid means the group will be shown.
	 * 
	 * @private
	 * 
	 * @param {Object} row 
	 * @returns 
	 */
	showRowByInspire(row) {
		if (!('agg_inspireid' in row)) {
			return true;
		}
		const idList = row.agg_inspireid.split(aggSeparator);
		// empty value means we want to show the group add inspire
		let empty = idList.includes('');
		if (empty) {
			return true;
		}
		// check if any inspire ids repeat this gives strong possiblity of duplicates
		const qList = row.agg_qid.split(aggSeparator);
		for (let i = 0; i < idList.length; i++) {
			const iid = idList[i];
			const q = qList[i];
			for (let j = i+1; j < idList.length; j++) {
				const next = idList[j];
				const qNext = qList[j];
				// make sure this is not the same Q
				if (q === qNext) {
					continue;
				}
				if (iid === next) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Check if row should go into the table (by hasPart).
	 * 
	 * This is for checking if work on the row is not done yet.
	 * 
	 * @private
	 * 
	 * @param {Object} row 
	 * @returns 
	 */
	showRowByParts(row) {
		if (!('agg_haspart' in row) || row.agg_haspart.length < 1) {
			return true;
		}
		const idList = row.agg_haspart.split(aggSeparator);
		let nonempty = idList.map((v,i)=>({v,i})).filter(e=>e.v.length);
		// skip when there is more then one parent
		if (nonempty.length != 1) {
			return true;
		}
		let parent = nonempty[0];
		parent.v = parent.v.split(',');
		// check if other items in the group are children
		const qList = row.agg_qid.split(aggSeparator).map(v=>v.startsWith('Q') ? v : 'Q'+v);
		const expectedCount = qList.length - 1;
		let foundCount = 0;
		for (let i = 0; i < qList.length; i++) {
			if (parent.i === i) {
				continue;
			}
			const q = qList[i];
			if (parent.v.indexOf(q) >= 0) {
				foundCount++;
			}
		}
		return foundCount !== expectedCount;
	}

	/**
	 * Check if row should go into the table (by isPartOf).
	 * 
	 * This is for checking if work on the row is not done yet.
	 * 
	 * @private
	 * 
	 * @param {Object} row 
	 * @returns 
	 */
	showRowByPartOf(row) {
		if (!('agg_ispartof' in row) || row.agg_ispartof.length < 1) {
			return true;
		}
		const idList = row.agg_ispartof.split(aggSeparator);
		// all must have parents
		let empty = idList.includes('');
		if (empty) {
			return true;
		}
		// skip when there is more then one parent
		const parent = idList[0];
		if (idList.findIndex((v)=>v!=parent) >= 0) {
			return true;
		}
		return false;
	}

	/**
	 * Check if the row is fully inspired.
	 * 
	 * Row/group is inspired if all items have unique inspire id.
	 * 
	 * @private
	 * 
	 * @param {Object} row 
	 * @returns 
	 */
	inspiredRow(row) {
		if (!this.showRowByParts(row)) {
			return false;
		}
		if (!('agg_inspireid' in row)) {
			return false;
		}
		// reject mulptiple inspire in one id
		if (row.agg_inspireid.indexOf(',') > 0) {
			return false;
		}
		const idList = row.agg_inspireid.split(aggSeparator);
		// empty value means we want to show the group add inspire
		let empty = idList.includes('');
		if (empty) {
			return false;
		}
		// check if any inspire ids repeat this gives strong possiblity of duplicates
		const qList = row.agg_qid.split(aggSeparator);
		for (let i = 0; i < idList.length; i++) {
			const iid = idList[i];
			const q = qList[i];
			for (let j = i+1; j < idList.length; j++) {
				const next = idList[j];
				const qNext = qList[j];
				// make sure this is not the same Q
				if (q === qNext) {
					continue;
				}
				if (iid === next) {
					return false;
				}
			}
		}
		return true;
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