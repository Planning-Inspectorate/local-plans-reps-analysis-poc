import type { AddPromptFormInput, AddPromptValidationResult, ErrorSummaryItem } from './interface.d.ts';

export function validateAddPromptForm(
	input: AddPromptFormInput,
	allowedCategories: readonly string[]
): AddPromptValidationResult {
	const displayName = parseString(input.displayName);
	const categoryRaw = parseString(input.category);
	const content = parseString(input.content);
	const changeNote = parseString(input.changeNote);

	const fieldErrors: Partial<AddPromptFormInput> = {};

	if (!displayName) {
		fieldErrors.displayName = 'Enter a name';
	}
	if (!content) {
		fieldErrors.content = 'Content cannot be empty';
	}

	if (!categoryRaw) {
		fieldErrors.category = 'Select a category';
	}

	let category: string | undefined = categoryRaw;
	if (categoryRaw) {
		const isAllowed = allowedCategories.includes(categoryRaw);
		if (!isAllowed) {
			fieldErrors.category = 'Invalid category';
		} else {
			category = categoryRaw;
		}
	}

	// Build error summary
	const errorSummary: ErrorSummaryItem[] = [];
	if (fieldErrors.displayName) {
		errorSummary.push({ text: fieldErrors.displayName, href: '#displayName' });
	}
	if (fieldErrors.category) {
		errorSummary.push({ text: fieldErrors.category, href: '#category' });
	}
	if (fieldErrors.content) {
		errorSummary.push({ text: fieldErrors.content, href: '#content' });
	}

	const isValid = errorSummary.length === 0;

	return {
		form: { displayName, category, content, changeNote },
		fieldErrors: isValid ? undefined : fieldErrors,
		errorSummary: isValid ? undefined : errorSummary,
		isValid
	};
}

export function parseString(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed.length ? trimmed : undefined;
	}
	return undefined;
}

export function buildCategoryItems(
	categories: string[],
	selected?: string
): { value: string; text: string; selected?: boolean }[] {
	const base = [{ value: '', text: 'Select a category' }];
	const items = categories.map((c) => ({ value: c, text: c, selected: selected === c }));
	return base.concat(items);
}
