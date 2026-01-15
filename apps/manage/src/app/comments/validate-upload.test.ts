import { describe, test } from 'node:test';
import assert from 'assert';
import { validateUpload, validateHeader } from './validate-upload.ts';
import type { FileUpload } from './interface.ts';

const MAGIC_BYTES = {
	XLSX: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
	CSV: Buffer.from('a,b\n1,2')
};

describe('validate-upload', () => {
	test('should return error when no file provided', () => {
		const result = validateUpload(undefined);
		assert.strictEqual(result.text, 'Please Select a file');
	});

	test('should return error when file exceeds 10MB', () => {
		const largeFile = {
			originalname: 'data.csv',
			size: 10 * 1024 * 1024 + 1
		} as FileUpload;

		const result = validateUpload(largeFile);
		assert.strictEqual(result.text, 'Maximum file size is 10MB');
	});

	test('should return error for unsupported file extension', () => {
		const badFile = {
			originalname: 'notes.txt',
			size: 1024
		} as FileUpload;

		const result = validateUpload(badFile);
		assert.strictEqual(result.text, 'Please upload a CSV or XLSX file');
	});

	test('should accept csv files without error', () => {
		const csvFile = {
			originalname: 'upload.CSV',
			size: 1024
		} as FileUpload;

		const result = validateUpload(csvFile);
		assert.strictEqual(result.text, 'Empty file');
	});

	test('should accept xlsx files without error', () => {
		const xlsxFile = {
			originalname: 'upload.xlsx',
			size: 2048
		} as FileUpload;

		const result = validateUpload(xlsxFile);
		assert.strictEqual(result.text, 'Empty file');
	});

	test('should handle filenames without extension', () => {
		const noExtFile = {
			originalname: 'upload',
			size: 2048
		} as FileUpload;

		const result = validateUpload(noExtFile);
		assert.strictEqual(result.text, 'Please upload a CSV or XLSX file');
	});

	test('should validate csv buffer content (valid)', () => {
		const csvFile = {
			originalname: 'data.csv',
			size: 32,
			buffer: MAGIC_BYTES.CSV
		} as FileUpload;

		const result = validateUpload(csvFile);
		assert.strictEqual(result.text, undefined);
		assert.strictEqual(result.extension, 'csv');
	});

	test('should validate csv buffer content (invalid)', () => {
		const csvFile = {
			originalname: 'data.csv',
			size: 32,
			buffer: Buffer.from('justtextwithoutdelimiters')
		} as FileUpload;

		const result = validateUpload(csvFile);
		assert.strictEqual(result.text, 'Invalid file format');
	});

	test('should validate xlsx buffer content (valid PK header)', () => {
		const xlsxFile = {
			originalname: 'data.xlsx',
			size: 32,
			buffer: MAGIC_BYTES.XLSX
		} as FileUpload;

		const result = validateUpload(xlsxFile);
		assert.strictEqual(result.text, undefined);
		assert.strictEqual(result.extension, 'xlsx');
	});

	test('should validate xlsx buffer content (invalid)', () => {
		const xlsxFile = {
			originalname: 'data.xlsx',
			size: 32,
			buffer: Buffer.from('notzipcontent')
		} as FileUpload;

		const result = validateUpload(xlsxFile);
		assert.strictEqual(result.text, 'Invalid file format');
	});
});

describe('validateHeader', () => {
	test('should detect CSV content', () => {
		const buf = Buffer.from('col1,col2\n1,2');
		const result = validateHeader(buf);
		assert.strictEqual(result, true);
	});

	test('should detect XLSX PK header', () => {
		const buf = Buffer.concat([MAGIC_BYTES.XLSX, Buffer.from([0x14, 0x00])]);
		const result = validateHeader(buf);
		assert.strictEqual(result, true);
	});

	test('should return undefined for binary-like content (contains null byte)', () => {
		const buf = Buffer.from([0x00, 0x01, 0x02, 0x03]);
		const result = validateHeader(buf);
		assert.strictEqual(result, undefined);
	});

	test('should return undefined for plain text without delimiters or newline', () => {
		const buf = Buffer.from('justtextwithoutdelimiters');
		const result = validateHeader(buf);
		assert.strictEqual(result, undefined);
	});

	test('should handle empty buffer as undefined', () => {
		const buf = Buffer.from('');
		const result = validateHeader(buf);
		assert.strictEqual(result, undefined);
	});
});
