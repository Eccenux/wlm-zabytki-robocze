/* global describe, it */
import { assert } from 'chai';
import { MonumentsLoader } from "../src/MonumentsLoader.js";

describe('MonumentsLoader', () => {
	describe('recordTransform', () => {
		let result;
		it('transform', () => {
			let record = {
				category: {type: 'literal', value: 'Carl-Maria-von-Weber-Museum'},
				coord:    {datatype: 'http://www.opengis.net/ont/geosparql#wktLiteral', type: 'literal', value: 'Point(13.8645 51.0168)'},
				itemLabel:{'xml:lang': 'en', type: 'literal', value: 'Carl-Maria-von-Weber-Museum'},
				townLabel:{'xml:lang': 'pl', type: 'literal', value: 'Drezno'},
				image:    {type: 'uri', value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Carlmariavonwebermuseum%20dresden2.jpg'},
				item:     {type: 'uri', value: 'http://www.wikidata.org/entity/Q1036560'},
				town:     {type: 'uri', value: 'http://www.wikidata.org/entity/Q1731'},
			};
			let expected = {
				category: 'Carl-Maria-von-Weber-Museum',
				coord:    {lon:'13.8645', lat:'51.0168'},
				itemLabel:'Carl-Maria-von-Weber-Museum',
				townLabel:'Drezno',
				image:    'http://commons.wikimedia.org/wiki/Special:FilePath/Carlmariavonwebermuseum%20dresden2.jpg',
				item:     'Q1036560',
				town:     'Q1731',
			};

			result = MonumentsLoader.recordTransform(record)
			assert.deepEqual(result, expected);
		});
	});
});