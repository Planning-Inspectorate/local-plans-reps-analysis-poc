import type { PromptVersionWithRelations } from '@pins/local-plans-reps-analysis-poc-lib/data/interface.d.ts';

export interface PromptVersionViewModel {
	backLink?: string;
	isManagePrompt: boolean;
	pageHeading: string;
	promptVersion: ViewPromptVersion[];
}

export interface ViewPromptVersion extends PromptVersionWithRelations {
	displayName: string;
	authorName: string;
	createdAtDisplay: string;
}
