import type { ManageService } from '#service';
import type { RequestHandler } from 'express';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms';
import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { setPromptStatusInSession } from '#util/prompt-session.ts';

import { PROMPT_JOURNEY_ID } from './journey.ts';

export function buildSaveController(service: ManageService): RequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('Processing Add Prompt request');

		if (!res.locals || !res.locals.journeyResponse) {
			logger.error('Journey response not found in res.locals');
			throw new Error('Journey response required');
		}

		const journeyResponse = res.locals.journeyResponse as JourneyResponse;
		const answers = journeyResponse.answers as Record<string, string>;

		if (typeof answers !== 'object') {
			throw new Error('Answers should be an object');
		}

		const { oid: entraId, name: fullName, preferred_username: email } = req?.session?.account?.idTokenClaims || {};

		try {
			await service.promptClient.createPrompt({
				displayName: answers.displayName,
				category: answers.category,
				content: answers.content,
				changeNote: answers.changeNote,
				entraId: entraId!,
				fullName: fullName!,
				email: email!
			});
			setPromptStatusInSession(req, 'added');
			clearDataFromSession({ req, journeyId: PROMPT_JOURNEY_ID });

			return res.redirect('/manage-prompts');
		} catch (error) {
			logger.error(error, 'Failed to create prompt');
			return res.render('views/errors/500.njk', { backLink: '/manage-prompts' });
		}
	};
}
