import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import type { PromptVersionViewModel } from './interface.d.ts';
import { toViewPromptVersion } from '../../../prompts/prompt-mappers.ts';

export function buildPromptVersionView(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('Prompt Version page');
		const { id } = req.params as { id: string };

		if (!id) {
			throw new Error('Prompt id is required');
		}

		const promptVersion = await service.promptClient.getPromptHistory(id);

		if (!promptVersion) return res.status(404).render('views/errors/404.njk', { backLink: '/manage-prompts' });

		const viewModel: PromptVersionViewModel = {
			backLink: '/manage-prompts',
			isManagePrompt: true,
			pageHeading: 'Prompt Version',
			promptVersion: promptVersion.map(toViewPromptVersion)
		};

		return res.render('views/prompts/version/view.njk', viewModel);
	};
}
