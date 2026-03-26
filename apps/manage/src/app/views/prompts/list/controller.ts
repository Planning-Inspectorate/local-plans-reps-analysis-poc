import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import type { PromptSummary } from '@pins/local-plans-reps-analysis-poc-lib/data/interface.ts';
import { clearSessionData, readSessionData } from '@pins/local-plans-reps-analysis-poc-lib/util/session.ts';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms';
import { PROMPT_JOURNEY_ID } from '../add/journey.ts';

interface PromptsViewModel {
	isManagePrompt: true;
	pageHeading: string;
	prompts: PromptSummary[];
	status?: string;
}

export function buildViewPrompts(service: ManageService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		logger.info('view Manage Prompt page');
		const status = readSessionData(req, 'lastRequest', 'status', '', 'persistence');
		const prompts: PromptSummary[] = await service.promptClient.getAllPrompts();
		const viewModel: PromptsViewModel = {
			isManagePrompt: true,
			pageHeading: 'Manage Prompts',
			prompts: prompts,
			status: status as string
		};

		clearDataFromSession({ req, journeyId: PROMPT_JOURNEY_ID });
		clearSessionData(req, 'lastRequest', ['status'], 'persistence');

		return res.render('views/prompts/list/view.njk', viewModel);
	};
}
