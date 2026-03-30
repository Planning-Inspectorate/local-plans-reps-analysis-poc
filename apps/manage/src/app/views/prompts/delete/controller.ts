import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import type { DeletePromptViewModel } from './interface.d.ts';
import { toViewPromptDetail } from '../../../prompts/prompt-mappers.ts';
import { setPromptStatusInSession } from '#util/prompt-session.ts';

export function buildDeletePromptView(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('Delete Confirmation page');
		const { id } = req.params;

		const prompt = await service.promptClient.getPromptById(String(id));
		if (!prompt) return res.render('views/errors/404.njk', { backLink: '/manage-prompts' });

		const viewModel: DeletePromptViewModel = {
			isManagePrompt: true,
			pageHeading: 'Delete Prompt',
			prompt: toViewPromptDetail(prompt)
		};
		return res.render('views/prompts/delete/view.njk', viewModel);
	};
}

export function buildDeletePromptPost(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('Delete Confirmation page');
		const { id } = req.params;
		if (id) {
			try {
				await service.promptClient.deletePrompt(String(id));
				setPromptStatusInSession(req, 'deleted');
				return res.redirect('/manage-prompts');
			} catch (error) {
				logger.error(error, 'Failed to delete prompt');
				return res.render('views/errors/500.njk', { backLink: '/manage-prompts' });
			}
		}
	};
}
