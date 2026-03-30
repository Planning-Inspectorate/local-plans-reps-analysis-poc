import type { QuestionProps } from '@planning-inspectorate/dynamic-forms';
import {
	COMPONENT_TYPES,
	createQuestions,
	questionClasses,
	RequiredValidator
} from '@planning-inspectorate/dynamic-forms';

export const QUESTION_URLS = {
	displayName: 'display-name',
	category: 'category',
	content: 'content',
	changeNote: 'change-note'
} as const;

export function getQuestions(isEditing = false, promptCategories: string[]) {
	const questionProps: Record<string, QuestionProps> = {
		displayName: {
			type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
			title: 'Display Name',
			question: 'What is the display name of the prompt?',
			fieldName: 'displayName',
			url: QUESTION_URLS.displayName,
			validators: [new RequiredValidator('You must enter a display name for the prompt')]
		},

		category: {
			type: COMPONENT_TYPES.SELECT,
			title: 'Category',
			question: 'What is the category of the prompt?',
			fieldName: 'category',
			url: QUESTION_URLS.category,
			validators: [new RequiredValidator('You must select a category for the prompt')],
			options: buildCategoryItems(promptCategories),
			disableAccessibleAutocomplete: true
		},

		content: {
			type: COMPONENT_TYPES.TEXT_ENTRY,
			title: 'Content',
			question: 'What is the content of the prompt?',
			fieldName: 'content',
			url: QUESTION_URLS.content,
			validators: [new RequiredValidator('You must add content of the prompt')]
		}
	};

	if (isEditing) {
		questionProps.changeNote = {
			type: COMPONENT_TYPES.TEXT_ENTRY,
			title: 'Change Note',
			question: 'What is the change note for the prompt?',
			fieldName: 'changeNote',
			url: QUESTION_URLS.changeNote,
			validators: [new RequiredValidator('You must add change note')]
		};
	}

	return createQuestions(questionProps, questionClasses, {}, {});
}

export function buildCategoryItems(
	categories: string[],
	selected?: string
): { value: string; text: string; selected?: boolean }[] {
	if (!categories) return [];
	const base = [{ value: '', text: 'Select a category' }];
	const items = categories.map((c) => ({ value: c, text: c, selected: selected === c }));
	return base.concat(items);
}
