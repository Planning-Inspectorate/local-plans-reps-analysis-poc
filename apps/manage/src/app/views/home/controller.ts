import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/service-name-lib/util/async-handler.ts';
import type { CommentsData } from '../../comments/interface.ts';
import { validateUpload } from '../../comments/validate-upload.ts';
import { parseCsv, buildParseExcel } from '../../comments/parse-file.ts';
import type { ErrorMessage } from './interface.ts';
import XLSX from 'xlsx';

export function buildViewHome(service: ManageService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		logger.info('view page');
		return res.render('views/home/view.njk');
	};
}

export function buildPostHome(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('post home');

		const parseExcel = buildParseExcel(XLSX);

		const file = req.file;
		const { text: validationError, extension } = validateUpload(file);

		let commentsData: CommentsData | null = null;
		let errorMessage: ErrorMessage | null = null;

		if (validationError) {
			errorMessage = { text: validationError };
		} else if (extension === 'xlsx') {
			commentsData = await parseExcel(file);
		} else if (extension === 'csv') {
			commentsData = await parseCsv(file);
		}

		return res.render('views/home/view.njk', {
			commentsData,
			errorMessage
		});
	};
}
