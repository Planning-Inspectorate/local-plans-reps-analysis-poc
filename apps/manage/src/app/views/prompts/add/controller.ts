import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import type { AddPromptViewModel } from './interface.d.ts';
import { buildCategoryItems, validateAddPromptForm } from '../../../prompts/validate-form.ts';
import { addSessionData } from '@pins/local-plans-reps-analysis-poc-lib/util/session.ts';

export function buildAddPromptView(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('view Add Prompt page');
		const categories = await service.promptClient.listPromptCategories();
		const viewModel: AddPromptViewModel = {
			backLink: '/manage-prompts',
			pageHeading: 'Add Prompt',
			actionPath: '/manage-prompts/add',
			categoriesItems: buildCategoryItems(categories),
			isEdit: false
		};
		return res.render('views/prompts/add/view.njk', viewModel);
	};
}

export function buildAddPromptPost(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('Processing Add Prompt request');

		const categories = await service.promptClient.listPromptCategories();
		const categoriesItems = buildCategoryItems(categories, req.body.category);

		const { form, fieldErrors, errorSummary, isValid } = validateAddPromptForm({ ...req.body }, categories);
		const { oid: entraId, name: fullName, preferred_username: email } = req?.session?.account?.idTokenClaims || {};

		const viewModel: AddPromptViewModel = {
			pageHeading: 'Add Prompt',
			backLink: '/manage-prompts',
			actionPath: '/manage-prompts/add',
			categoriesItems,
			form,
			fieldErrors,
			errorSummary,
			isEdit: false
		};

		if (!isValid) {
			return res.render('views/prompts/add/view.njk', viewModel);
		}

		try {
			await service.promptClient.createPrompt({
				displayName: form.displayName!,
				category: form.category!,
				content: form.content!,
				changeNote: form.changeNote!,
				entraId: entraId!,
				fullName: fullName!,
				email: email!
			});
			addSessionData(req, 'lastRequest', { status: 'added' }, 'persistence');
			return res.redirect('/manage-prompts');
		} catch (error) {
			logger.error(error, 'Failed to create prompt');
			return res.render('views/errors/500.njk', { backLink: '/manage-prompts' });
		}
	};
}
