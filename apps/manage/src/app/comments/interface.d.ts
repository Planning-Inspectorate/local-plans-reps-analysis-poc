import type { Express } from 'express';

export interface CommentsData {
	fileType: 'excel' | 'csv';
	fileName: string;
	comments: string[];
	totalCount: number;
}

export interface ValidationError {
	extension?: string;
	text?: string;
}

export type ValidateHeader = boolean | undefined;

export type FileUpload = Express.Multer.File;
