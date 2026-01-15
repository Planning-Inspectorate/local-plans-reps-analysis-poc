import { describe, test } from 'node:test';
import assert from 'assert';
import XLSX from 'xlsx';
import type { WorkSheet, Sheet2JSONOpts } from 'xlsx';
import { buildParseExcel, parseCsv } from './parse-file.ts';
import { mockCsvFile, mockExcelFile } from '../views/home/controller.test.ts';

describe('parse-file parseExcel', () => {
	const makeMockXLSX = (rows: Record<string, string>[]) =>
		({
			read: ((_data: Buffer, _opts?: XLSX.ParsingOptions) => ({
				SheetNames: ['Sheet1'],
				Sheets: { Sheet1: {} as WorkSheet }
			})) as typeof XLSX.read,
			utils: {
				sheet_to_json: ((_ws: WorkSheet, _opts?: Sheet2JSONOpts) => rows) as typeof XLSX.utils.sheet_to_json
			}
		}) as typeof XLSX;

	test('should parse comments column (case-insensitive) and count only non-empty values', async () => {
		const mockXLSX = makeMockXLSX([
			{ Comments: 'First' },
			{ comments: 'Second' },
			{ CoMmEnTs: 'Third' },
			{ comments: '' },
			{ note: 'no comments here' }
		]);
		const parseExcel = buildParseExcel(mockXLSX);

		const file = mockExcelFile([
			{ Comments: 'First' },
			{ comments: 'Second' },
			{ CoMmEnTs: 'Third' },
			{ comments: '' },
			{ note: 'no comments here' }
		]);
		const result = await parseExcel(file);
		assert.deepStrictEqual(result.comments, ['First', 'Second', 'Third']);
		assert.strictEqual(result.totalCount, 3);
		assert.strictEqual(result.fileName, 'upload.xlsx');
		assert.strictEqual(result.fileType, 'excel');
	});

	test('should return empty comments when comments column is missing', async () => {
		const mockXLSX = makeMockXLSX([{ title: 'row1' }, { name: 'row2' }]);
		const parseExcel = buildParseExcel(mockXLSX);

		const file = mockExcelFile([{ title: 'row1' }, { name: 'row2' }]);
		const result = await parseExcel(file);

		assert.deepStrictEqual(result.comments, []);
		assert.strictEqual(result.totalCount, 0);
		assert.strictEqual(result.fileType, 'excel');
	});
});

describe('parse-file parseCsv', () => {
	test('should parse comments column (case-insensitive) and count only non-empty values', async () => {
		const properCsvContent = [
			'Comments,Other',
			'First,1',
			'Second,2',
			'CoMmEnTs,3' // value, not a header
		].join('\n');

		const file = mockCsvFile(properCsvContent);
		const result = await parseCsv(file);

		assert.deepStrictEqual(result.comments, ['First', 'Second', 'CoMmEnTs']);
		assert.strictEqual(result.totalCount, 3);
		assert.strictEqual(result.fileName, 'upload.csv');
		assert.strictEqual(result.fileType, 'csv');
	});

	test('should ignore empty comment values and only count non-empty', async () => {
		const csvContent = ['comments,other', 'First,1', ',2', 'Third,3', ' ,4'].join('\n');

		const file = mockCsvFile(csvContent);
		const result = await parseCsv(file);

		assert.deepStrictEqual(result.comments, ['First', 'Third']);
		assert.strictEqual(result.totalCount, 2);
		assert.strictEqual(result.fileType, 'csv');
	});

	test('should return empty comments when comments column is missing', async () => {
		const csvContent = ['title,name', 'row1,rowA', 'row2,rowB'].join('\n');

		const file = mockCsvFile(csvContent);
		const result = await parseCsv(file);

		assert.deepStrictEqual(result.comments, []);
		assert.strictEqual(result.totalCount, 0);
		assert.strictEqual(result.fileType, 'csv');
	});
});
