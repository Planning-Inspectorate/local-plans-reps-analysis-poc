import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import { buildCategoryItems, validateAddPromptForm } from '../../../prompts/validate-form.ts';
import { buildBaseViewModel, loadPromptContext } from '../../../prompts/prompt-context.ts';
import { addSessionData } from '@pins/local-plans-reps-analysis-poc-lib/util/session.ts';

export function buildEditPromptView(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('view Edit Prompt page');

		const { id } = req.params as { id: string };
		const prompt = await loadPromptContext(service, id);

		if (!prompt) {
			return res.render('views/errors/404.njk', { backLink: '/manage-prompts' });
		}

		const { current, categories } = prompt;
		const categoriesItems = buildCategoryItems(categories, current.category);

		const form = {
			displayName: current.displayName,
			category: current.category,
			content: current.content
		};
		const viewModel = buildBaseViewModel(id, { categoriesItems, form, isEdit: true });
		return res.render('views/prompts/add/view.njk', viewModel);
	};
}

export function buildEditPromptPost(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const { logger } = service;
		logger.info('Post edit Prompt page');

		const { id } = req.params as { id: string };
		const prompt = await loadPromptContext(service, id);

		if (!prompt) {
			return res.render('views/errors/404.njk', { backLink: '/manage-prompts' });
		}

		const { categories, current } = prompt;

		const categoriesItems = buildCategoryItems(categories, req.body.category);
		const { form, fieldErrors, errorSummary, isValid } = validateAddPromptForm({ ...req.body }, categories);

		const isFormUnchanged =
			form.displayName === current.displayName &&
			form.category === current.category &&
			form.content === current.content;

		const viewModel = {
			...buildBaseViewModel(id, { categoriesItems, form, isEdit: true }),
			isFormUnchanged,
			fieldErrors,
			errorSummary
		};

		if (!isValid || isFormUnchanged) {
			return res.render('views/prompts/add/view.njk', viewModel);
		}

		const { oid: entraId, name: fullName, preferred_username: email } = req?.session?.account?.idTokenClaims || {};

		try {
			await service.promptClient.updatePrompt({
				promptId: id,
				displayName: form.displayName!,
				category: form.category!,
				content: form.content!,
				changeNote: form.changeNote!,
				entraId: entraId!,
				fullName: fullName!,
				email: email!
			});
			addSessionData(req, 'lastRequest', { status: 'updated' }, 'persistence');
			return res.redirect('/manage-prompts');
		} catch (error) {
			logger.error(error, 'Failed to update prompt');
			return res.render('views/errors/500.njk', { backLink: '/manage-prompts' });
		}
	};
}
