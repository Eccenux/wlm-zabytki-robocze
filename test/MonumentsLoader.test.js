/* global describe, it */
import { assert } from 'chai';
import { MonumentsLoader } from "../src/MonumentsLoader.js";

describe('MonumentsLoader', () => {
	describe('recordTransform', () => {
		let result;
		it('transform full', () => {
			let record = {
				coord:    {datatype: 'http://www.opengis.net/ont/geosparql#wktLiteral', type: 'literal', value: 'Point(13.8645 51.0168)'},
				item:     {type: 'uri', value: 'http://www.wikidata.org/entity/Q1036560'},
				itemLabel:{'xml:lang': 'en', type: 'literal', value: 'Carl-Maria-von-Weber-Museum'},
				town:     {type: 'uri', value: 'http://www.wikidata.org/entity/Q1731'},
				townLabel:{'xml:lang': 'pl', type: 'literal', value: 'Drezno'},
				state:     {type: 'uri', value: 'http://www.wikidata.org/entity/Q1234567890'},
				stateLabel:{'xml:lang': 'pl', type: 'literal', value: 'województwo pomorsko-zębrzyckie'},
				
				types:          {type: 'literal', value: 'abc, def'},
				inspireIds:     {type: 'literal', value: 'PL.1.9.ZIPOZ.NID_N_02_BK.85004'},
				monumentStatus: {type: 'literal', value: 'zabytek nieruchomy'},
				hasPart:      {type: 'literal', value: 'http://www.wikidata.org/entity/Q123, http://www.wikidata.org/entity/Q456'},
				isPartOf:      {type: 'literal', value: 'http://www.wikidata.org/entity/Q789'},
				otherThen:      {type: 'literal', value: 'http://www.wikidata.org/entity/Q123, http://www.wikidata.org/entity/Q456'},
				street:         {type: 'literal', value: 'Myśliwska 8/9'},
			};
			let expected = {
				coord:    {lon:'13.8645', lat:'51.0168'},
				item:     'Q1036560',
				itemLabel:'Carl-Maria-von-Weber-Museum',
				town:     'Q1731',
				townLabel:'Drezno',
				state:     'Q1234567890',
				stateLabel:'województwo pomorsko-zębrzyckie',

				types:          'abc, def',
				inspireIds:     'PL.1.9.ZIPOZ.NID_N_02_BK.85004',
				monumentStatus: 'zabytek nieruchomy',
				hasPart:      'Q123, Q456',
				isPartOf:      'Q789',
				otherThen:      'Q123, Q456',
				street:         'Myśliwska 8/9',
			};

			result = MonumentsLoader.recordTransform(record)
			assert.deepEqual(result, expected);
		});
		it('transform none', () => {
			let record = {
				category: {},
				coord:    {},
				itemLabel:{},
				townLabel:{},
				item:     {},
				town:     {},
				"types": {},
				"inspireIds": {},
				"monumentStatus": {},
				"state": {},
				"stateLabel": {},
				hasPart: {},
				isPartOf: {},
				otherThen: {},
				street: {},
			};
			let expected = {
				coord:    {lon:undefined, lat:undefined},
				itemLabel:undefined,
				townLabel:undefined,
				item:     undefined,
				town:     undefined,
				"types": undefined,
				"inspireIds": undefined,
				"monumentStatus": undefined,
				"state": undefined,
				"stateLabel": undefined,
				hasPart: undefined,
				isPartOf: undefined,
				otherThen: undefined,
				street: undefined,
			};

			result = MonumentsLoader.recordTransform(record)
			assert.deepEqual(result, expected);
		});
	});
});