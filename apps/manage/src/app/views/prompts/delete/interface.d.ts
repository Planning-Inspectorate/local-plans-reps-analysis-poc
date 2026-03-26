import type { PromptWithLatest } from '@pins/local-plans-reps-analysis-poc-lib/data/interface.d.ts';

export interface DeletePromptViewModel {
	isManagePrompt: boolean;
	pageHeading: string;
	prompt: PromptWithLatest;
}
