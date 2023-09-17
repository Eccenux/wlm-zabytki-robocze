/* global describe, it */
import { assert } from 'chai';
import MediaWikiDumper from "../src/db/MediaWikiDumper.js";

const aggSeparator = ' ;; ';
/*const sqlQuery =  `
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
`;
/**/

/** Base row factory. */
function baseRow(qList, inspireList) {
	const qSet = new Set(...qList);
	return {
		latlon:'13.8645:51.0168',	// whatever
		rowCount: qList.length,
		cnt: qSet.size,
		agg_qid: qList.join(aggSeparator),
		agg_inspireid: inspireList.join(aggSeparator),
	};
}
describe('MediaWikiDumper', () => {
	describe('showRowByInspire', () => {
		let dumper = new MediaWikiDumper();
		let result;
		let expected;
		let row;
		it('all inspire std', () => {
			row = baseRow(
				['Q1', 'Q2'],
				['PL1', 'PL2'],
			);
			expected = false;
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
		it('some missing', () => {
			row = baseRow(
				['Q1', 'Q2'],
				['PL1', ''],
			);
			expected = true;
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
		it('all missing', () => {
			row = baseRow(
				['Q1', 'Q2'],
				['', ''],
			);
			expected = true;
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
		it('different Q same inspire', () => {
			// this might indicate Q1 is the same things as Q2 and Q3
			// so we want this to be shown in the tables
			expected = true;
			row = baseRow(
				['Q1', 'Q2', 'Q3'],
				['PL1', 'PL1', 'PL1'],
			);
			result = dumper.showRow(row);
			assert.equal(result, expected);

			// this might indicate Q1 is the same thing as Q2
			row = baseRow(
				['Q1', 'Q2'],
				['PL1', 'PL1'],
			);
			result = dumper.showRow(row);
			assert.equal(result, expected);

			// this also might indicate Q1 is the same thing as Q2 (Q3 is probably different, but we show it for clarity)
			row = baseRow(
				['Q1', 'Q2', 'Q3'],
				['PL1', 'PL1', 'PL2'],
			);
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
		it('repeated Q but different inspire', () => {
			row = baseRow(
				['Q1', 'Q1', 'Q2'],
				['PL1', 'PL1', 'PL2'],
			);
			expected = false;
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
	});
	describe('showRowByParts', () => {
		let dumper = new MediaWikiDumper();
		let result;
		let expected;
		let row;
	
		it('all other matched', () => {
			expected = false;	// don't show / skip

			row = baseRow(
				['1', '2'],
				['', ''],
			);
			row.agg_haspart = ['Q2', ''].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);

			row = baseRow(
				['1', '2'],
				['', ''],
			);
			row.agg_haspart = ['', 'Q1'].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);

			row = baseRow(
				['1', '2'],
				['', ''],
			);
			row.agg_haspart = ['', 'Q23,Q1,Q7'].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);

			row = baseRow(
				['1', '2', '3'],
				['', '', ''],
			);
			row.agg_haspart = ['', '', 'Q23,Q1,Q2'].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
		// only prefix is matched, not whole Q
		it('same prefix only', () => {
			expected = true;	// show

			row = baseRow(
				['Q1', 'Q2'],
				['', ''],
			);
			row.agg_haspart = ['', 'Q123'].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);

			row = baseRow(
				['Q1', 'Q2'],
				['', ''],
			);
			row.agg_haspart = ['Q23', ''].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
	});
	describe('showRowByPartOf', () => {
		let dumper = new MediaWikiDumper();
		let result;
		let expected;
		let row;
	
		it('common parent', () => {
			expected = false;	// don't show / skip

			row = baseRow(
				['1', '2'],
				['', ''],
			);
			row.agg_ispartof = ['Q3', 'Q3'].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);

			row = baseRow(
				['1', '2', '3'],
				['', '', ''],
			);
			row.agg_ispartof = ['Q4', 'Q4', 'Q4'].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
		it('different parent', () => {
			expected = true;	// show

			row = baseRow(
				['Q1', 'Q2'],
				['', ''],
			);
			row.agg_ispartof = ['Q3', 'Q4'].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);

			row = baseRow(
				['1', '2', '3'],
				['', '', ''],
			);
			row.agg_ispartof = ['Q4', 'Q4', 'Q5'].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
		it('missing parent', () => {
			expected = true;	// show

			row = baseRow(
				['Q1', 'Q2'],
				['', ''],
			);
			row.agg_ispartof = ['Q3', ''].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);

			row = baseRow(
				['1', '2', '3'],
				['', '', ''],
			);
			row.agg_ispartof = ['Q4', 'Q4', ''].join(aggSeparator),
			result = dumper.showRow(row);
			assert.equal(result, expected);
		});
	});

	describe('inspiredRow', () => {
		let dumper = new MediaWikiDumper();
		let result;
		let expected;
		let row;
		it('all inspire std', () => {
			row = baseRow(
				['Q1', 'Q2'],
				['PL1', 'PL2'],
			);
			expected = true;
			result = dumper.inspiredRow(row);
			assert.equal(result, expected);
		});
		it('some missing', () => {
			row = baseRow(
				['Q1', 'Q2'],
				['PL1', ''],
			);
			expected = false;
			result = dumper.inspiredRow(row);
			assert.equal(result, expected);
		});
		it('all missing', () => {
			row = baseRow(
				['Q1', 'Q2'],
				['', ''],
			);
			expected = false;
			result = dumper.inspiredRow(row);
			assert.equal(result, expected);
		});
		it('different Q same inspire', () => {
			// this might indicate Q1 is the same things as Q2 and Q3
			// so we want this to be shown in the tables
			expected = false;
			row = baseRow(
				['Q1', 'Q2', 'Q3'],
				['PL1', 'PL1', 'PL1'],
			);
			result = dumper.inspiredRow(row);
			assert.equal(result, expected);

			// this might indicate Q1 is the same thing as Q2
			row = baseRow(
				['Q1', 'Q2'],
				['PL1', 'PL1'],
			);
			result = dumper.inspiredRow(row);
			assert.equal(result, expected);

			// this also might indicate Q1 is the same thing as Q2 (Q3 is probably different, but we show it for clarity)
			row = baseRow(
				['Q1', 'Q2', 'Q3'],
				['PL1', 'PL1', 'PL2'],
			);
			result = dumper.inspiredRow(row);
			assert.equal(result, expected);
		});
		it('repeated Q but different inspire', () => {
			row = baseRow(
				['Q1', 'Q1', 'Q2'],
				['PL1', 'PL1', 'PL2'],
			);
			expected = true;
			result = dumper.inspiredRow(row);
			assert.equal(result, expected);
		});
		it('multi inpire in any Q', () => {
			expected = false;

			row = baseRow(
				['Q1', 'Q2', 'Q3'],
				['PL1', 'PL1,PL2', 'PL2'],
			);
			result = dumper.inspiredRow(row);
			assert.equal(result, expected);

			row = baseRow(
				['Q1', 'Q2', 'Q3'],
				['PL1', 'PL2', 'PL3,PL4'],
			);
			result = dumper.inspiredRow(row);
			assert.equal(result, expected);
		});
	});
});