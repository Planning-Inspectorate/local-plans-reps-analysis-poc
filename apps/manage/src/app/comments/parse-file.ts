import csv from 'csv-parser';
import { Readable } from 'stream';
import type { CommentsData, FileUpload } from './interface.d.ts';

export const buildParseExcel = (XLSX: typeof import('xlsx')) => {
	return async (file: FileUpload | undefined): Promise<CommentsData> => {
		if (!file) {
			throw new Error('No file provided');
		}
		const buffer = file.buffer;
		const workbook = XLSX.read(buffer, { type: 'buffer' });

		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];

		const data = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);

		const comments: string[] = data.map(extractComment).filter((comment): comment is string => Boolean(comment));

		return {
			comments,
			fileName: file.originalname,
			fileType: 'excel',
			totalCount: comments.length
		};
	};
};

export const parseCsv = async (file: FileUpload | undefined): Promise<CommentsData> => {
	if (!file) {
		throw new Error('No file provided');
	}
	const comments: string[] = [];
	const stream = Readable.from(file.buffer);

	await new Promise<void>((resolve, reject) => {
		stream
			.pipe(csv())
			.on('data', (row) => {
				const comment = extractComment(row as Record<string, string>);
				if (comment) comments.push(comment);
			})
			.on('end', () => resolve())
			.on('error', (err) => reject(err));
	});
	return {
		comments,
		fileName: file.originalname,
		fileType: 'csv',
		totalCount: comments.length
	};
};

// extract the comment from a record, handling different casing and trimming.
const extractComment = (record: Record<string, string>): string | null => {
	const key = Object.keys(record).find((k) => k.toLowerCase().trim() === 'comments');
	const val = key ? record[key] : null;
	if (val == null) return null;
	const str = typeof val === 'string' ? val : String(val);
	const trimmed = str.trim();
	return trimmed.length > 0 ? trimmed : null;
};
