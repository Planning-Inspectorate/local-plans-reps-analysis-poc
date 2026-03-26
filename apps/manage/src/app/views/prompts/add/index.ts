import { Router as createRouter } from 'express';
import type { ManageService } from '#service';
import type { IRouter } from 'express';
import {
	buildGetJourney,
	buildGetJourneyResponseFromSession,
	buildList,
	buildSave,
	question,
	saveDataToSession,
	validationErrorHandler,
	validate
} from '@planning-inspectorate/dynamic-forms';
import { getQuestions } from './questions.ts';
import { createJourney, PROMPT_JOURNEY_ID } from './journey.ts';
import { buildSaveController } from './save.ts';
import { fetchPromptCategoriesMiddleware } from '../view/controller.ts';

export function createAddPromptsRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Get prompt categories
	router.use(fetchPromptCategoriesMiddleware(service));

	const getJourneyResponse = buildGetJourneyResponseFromSession(PROMPT_JOURNEY_ID);
	const getJourney = buildGetJourney((req, journeyResponse) => {
		const promptCategories = req.res?.locals?.promptCategories ?? [];
		const questions = getQuestions(false, promptCategories);
		return createJourney(req, journeyResponse, questions);
	});

	// Create routes
	router.get('/:section/:question', getJourneyResponse, getJourney, question);
	router.post(
		'/:section/:question',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(saveDataToSession)
	);

	router.get('/check-your-answer', getJourneyResponse, getJourney, buildList());
	router.post('/check-your-answer', getJourneyResponse, getJourney, buildSaveController(service));

	return router;
}
