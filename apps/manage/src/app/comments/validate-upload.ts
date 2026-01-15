import path from 'path';
import type { FileUpload, ValidateHeader, ValidationError } from './interface.ts';

export const validateUpload = (file: FileUpload | undefined): ValidationError => {
	const MAX_FILE_SIZE = 10 * 1024 * 1024;
	const allowedExtensions = ['csv', 'xlsx'];

	if (!file) {
		return { text: 'Please Select a file' };
	}

	if (file.size > MAX_FILE_SIZE) {
		return { text: 'Maximum file size is 10MB' };
	}

	const extension = path.extname(file.originalname).toLowerCase().slice(1);

	if (!extension || !allowedExtensions.includes(extension)) {
		return { text: 'Please upload a CSV or XLSX file' };
	}

	if (!file.buffer) {
		return { text: 'Empty file' };
	}

	const validatedHeader = validateHeader(file.buffer);

	if (validatedHeader === undefined) {
		return { text: 'Invalid file format' };
	}

	return { extension };
};

export const validateHeader = (buf: Buffer): ValidateHeader => {
	// Excel Validation: check for Excel Magic Number (0x50 0x4B 0x03 0x04)
	const excelHeader = Buffer.from('504B0304', 'hex');
	const isExcelHeader = buf.length >= 4 && Buffer.compare(buf.subarray(0, 4), excelHeader) === 0;
	if (isExcelHeader) return true;

	// CSV Validation: check for text content and delimiters
	const checkLength = Math.min(buf.length, 4096);
	const sample = buf.slice(0, checkLength);

	for (let i = 0; i < sample.length; i++) {
		if (sample[i] === 0) return undefined;
	}

	const textSample = sample.toString('utf8');
	const hasDelimiter = /[,\t;|]/.test(textSample);
	const isText = textSample.length > 0;

	if (isText && (hasDelimiter || textSample.includes('\n'))) return true;

	return undefined;
};
