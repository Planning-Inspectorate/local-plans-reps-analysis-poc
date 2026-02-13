import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import type { PromptSummary } from '@pins/local-plans-reps-analysis-poc-lib/data/interface.ts';
import { clearSessionData, readSessionData } from '@pins/local-plans-reps-analysis-poc-lib/util/session.ts';

interface PromptsViewModel {
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
			pageHeading: 'Manage Prompts',
			prompts: prompts,
			status: status as string
		};
		clearSessionData(req, 'lastRequest', ['status'], 'persistence');
		return res.render('views/prompts/list/view.njk', viewModel);
	};
}
