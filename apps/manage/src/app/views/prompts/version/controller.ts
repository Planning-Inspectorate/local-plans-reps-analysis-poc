import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import type { PromptVersionViewModel } from './interface.d.ts';

export function buildPromptVersionView(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('Prompt Version page');
		const { id } = req.params;
		const promptVersion = await service.promptClient.listPromptHistory(id);

		if (!promptVersion) return res.status(404).render('views/errors/404.njk', { backLink: '/manage-prompts' });

		const viewModel: PromptVersionViewModel = {
			backLink: '/manage-prompts',
			pageHeading: 'Prompt Version',
			promptVersion
		};
		return res.render('views/prompts/version/view.njk', viewModel);
	};
}
