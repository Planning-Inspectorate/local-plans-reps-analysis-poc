import type { ManageService } from '#service';
import type { RequestHandler } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { asyncHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import { toViewPromptDetail } from '../../../prompts/prompt-mappers.ts';
import { VIEW_PROMPT_JOURNEY_ID } from '../add/journey.ts';
import { QUESTION_URLS } from '../add/questions.ts';

export function buildGetJourneyMiddleware(service: ManageService): RequestHandler {
	return async (req, res, next) => {
		const { id } = req.params as { id: string };
		if (!id) {
			throw new Error('Prompt id is required');
		}
		service.logger.info({ id }, 'View prompt');

		const prompt = await service.promptClient.getPromptById(id);

		if (!prompt) {
			res.status(404).render('views/errors/404.njk');
			return;
		}

		const sessionAnswers = req.session?.forms?.[VIEW_PROMPT_JOURNEY_ID] ?? {};
		const answers = { ...toViewPromptDetail(prompt), ...sessionAnswers };
		res.locals.journeyResponse = new JourneyResponse(VIEW_PROMPT_JOURNEY_ID, 'ref', answers);

		next();
	};
}

/**
 * Middleware that clears the changeNote field in the session whenever the user
 * navigates to one of the tracked question pages during an edit flow
 * (display-name, category, or content). This resets any previous note so that
 * the user must provide a fresh change note for the new edit.
 */
const TRACKED_QUESTION_URLS = new Set<string>([
	QUESTION_URLS.displayName,
	QUESTION_URLS.category,
	QUESTION_URLS.content
]);

export function clearChangeNoteMiddleware(
	req: Request,
	_res: Response,
	next: NextFunction,
	trackedQuestionUrls = TRACKED_QUESTION_URLS
): void {
	const questionUrl = req.params.question as string;
	if (trackedQuestionUrls.has(questionUrl)) {
		if (!req.session.forms) {
			req.session.forms = {};
		}
		if (!req.session.forms[VIEW_PROMPT_JOURNEY_ID]) {
			req.session.forms[VIEW_PROMPT_JOURNEY_ID] = {};
		}
		req.session.forms[VIEW_PROMPT_JOURNEY_ID].changeNote = '';
	}
	next();
}

export function fetchPromptCategoriesMiddleware(service: ManageService) {
	return asyncHandler(async (_req: Request, res: Response, next: NextFunction) => {
		res.locals.promptCategories = await service.promptClient.getPromptCategories();
		next();
	});
}

export function managePromptMiddleware(_req: Request, res: Response, next: NextFunction): void {
	res.locals.isManagePrompt = true;
	next();
}
