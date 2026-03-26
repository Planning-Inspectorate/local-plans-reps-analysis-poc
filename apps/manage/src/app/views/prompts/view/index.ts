import { Router as createRouter } from 'express';
import type { ManageService } from '#service';
import type { IRouter } from 'express';
import {
	buildGetJourney,
	buildList,
	buildSave,
	question,
	validationErrorHandler,
	validate,
	saveDataToSession
} from '@planning-inspectorate/dynamic-forms';
import { createJourney } from './journey.ts';
import { getQuestions } from '../add/questions.ts';
import { buildGetJourneyMiddleware, clearChangeNoteMiddleware, fetchPromptCategoriesMiddleware } from './controller.ts';
import { buildEditFn } from '../edit/controller.ts';

export function createViewPromptsRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Get prompt categories
	router.use(fetchPromptCategoriesMiddleware(service));

	const getJourneyResponse = buildGetJourneyMiddleware(service);
	const getJourney = buildGetJourney((req, journeyResponse) => {
		const promptCategories = req.res?.locals?.promptCategories ?? [];
		const questions = getQuestions(true, promptCategories);
		return createJourney(req, journeyResponse, questions);
	});

	router.get('/', getJourneyResponse, getJourney, buildList());

	// Save and redirect to the prompt listings page
	router.post('/', getJourneyResponse, buildEditFn(service));

	router.get('/:section/:question', getJourneyResponse, getJourney, question);
	router.post(
		'/:section/:question',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		clearChangeNoteMiddleware,
		buildSave(saveDataToSession, true)
	);

	return router;
}
