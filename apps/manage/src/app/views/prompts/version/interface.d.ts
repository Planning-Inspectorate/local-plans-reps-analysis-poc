import type { PromptVersionWithRelations } from '@pins/service-name-lib/data/interface.ts';

export interface PromptVersionViewModel {
	backLink?: string;
	pageHeading: string;
	promptVersion: PromptVersionWithRelations[];
}
