import type { ManageService } from '#service';
import type { RequestHandler } from 'express';
import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms';
import { setPromptStatusInSession } from '#util/prompt-session.ts';
import { VIEW_PROMPT_JOURNEY_ID } from '../add/journey.ts';

export function buildEditFn(service: ManageService): RequestHandler {
	return async (req, res) => {
		const { id } = req.params;
		const { oid: entraId, name: fullName, preferred_username: email } = req?.session?.account?.idTokenClaims || {};

		const journeyResponse = res.locals.journeyResponse as JourneyResponse | undefined;
		const answers = (journeyResponse?.answers ?? {}) as Record<string, string>;

		try {
			await service.promptClient.updatePrompt({
				promptId: String(id),
				displayName: answers.displayName!,
				category: answers.category!,
				content: answers.content!,
				changeNote: answers.changeNote ?? '',
				entraId: entraId!,
				fullName: fullName!,
				email: email!
			});

			clearDataFromSession({ req, journeyId: VIEW_PROMPT_JOURNEY_ID });
			setPromptStatusInSession(req, 'updated');
			service.logger.info('Prompt edit submitted');
			return res.redirect('/manage-prompts');
		} catch (error) {
			service.logger.error(error, 'Failed to update prompt');
			throw error;
		}
	};
}
