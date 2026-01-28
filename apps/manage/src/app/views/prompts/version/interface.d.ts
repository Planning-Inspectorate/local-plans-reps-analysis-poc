import type { PromptVersionWithRelations } from '@pins/local-plans-reps-analysis-poc-lib/data/interface.ts';

export interface PromptVersionViewModel {
	backLink?: string;
	pageHeading: string;
	promptVersion: PromptVersionWithRelations[];
}
