/**
 * Pure mapping functions for transforming raw Prisma prompt data into view model types.
 *
 * @module PromptMappers
 */

import type {
	PromptVersionWithRelations,
	PromptSummary,
	PromptDetail
} from '@pins/local-plans-reps-analysis-poc-lib/data/interface.ts';
import type { ViewPromptVersion } from '../views/prompts/version/interface.d.ts';
import type { ViewPromptSummary } from '../views/prompts/list/interface.d.ts';
import type { ViewPromptDetail } from '../views/prompts/view/interface.d.ts';
import { formatDateForDisplay } from '@planning-inspectorate/dynamic-forms';
import { capitalizeWords } from '#util/string-helpers.ts';

export function toViewPromptSummary(prompt: PromptSummary): ViewPromptSummary {
	return {
		...prompt,
		displayName: capitalizeWords(prompt.displayName),
		category: capitalizeWords(prompt.Category?.name ?? ''),
		createdAt: formatDateForDisplay(prompt.createdAt ?? ''),
		authorName: capitalizeWords(prompt.Author?.fullName ?? '')
	};
}

export function toViewPromptDetail(prompt: PromptDetail): ViewPromptDetail {
	return {
		...prompt,
		category: prompt.Category?.name ?? '',
		content: prompt.CurrentVersion?.content ?? '',
		changeNote: prompt.CurrentVersion?.changeNote ?? ''
	};
}

export function toViewPromptVersion(version: PromptVersionWithRelations): ViewPromptVersion {
	return {
		...version,
		displayName: version.Prompt?.displayName ?? '',
		authorName: capitalizeWords(version.Editor?.fullName ?? ''),
		createdAtDisplay: formatDateForDisplay(version.createdAt ?? '')
	};
}
