interface PromptsViewModel {
	isManagePrompt: true;
	pageHeading: string;
	prompts: ViewPromptSummary[];
	status?: string;
}

export interface ViewPromptSummary {
	id: string;
	displayName: string;
	category?: string | null;
	createdAt: string | Date;
	authorName: string | null;
}
