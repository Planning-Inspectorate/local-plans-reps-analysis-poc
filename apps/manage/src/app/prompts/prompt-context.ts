import { ManageService } from '#service';
import type { AddPromptViewModel } from '../views/prompts/add/interface.d.ts';

export async function loadPromptContext(service: ManageService, id: string) {
	const prompt = await service.promptClient.getPromptById(id);
	if (!prompt) return null;

	const categories = await service.promptClient.listPromptCategories();
	if (!categories) return null;

	const current = {
		category: prompt.Category?.name ?? '',
		displayName: prompt.displayName ?? '',
		content: prompt.latestVersion?.content ?? ''
	};

	return { prompt, categories, current };
}

export function buildBaseViewModel(
	id: string,
	overrides: Pick<AddPromptViewModel, 'categoriesItems' | 'form' | 'isEdit'>
): AddPromptViewModel {
	return {
		pageHeading: 'Edit Prompt',
		backLink: '/manage-prompts',
		actionPath: `/manage-prompts/${id}/edit`,
		isEdit: true,
		...overrides
	};
}
