import type { Prompt, PromptVersion, User } from '@pins/local-plans-reps-analysis-poc-database/src/client/client.ts';

export interface PromptSummary {
	id: string;
	displayName: string;
	category?: string | null;
	createdAt: string | Date;
	authorName: string | null;
	latestVersion?: {
		id: string;
		createdAt: Date;
		changeNote?: string | null;
	};
}

export interface UserInput {
	entraId: string;
	fullName?: string | null;
	email?: string | null;
}

export interface CreatePromptInput extends UserInput {
	displayName: string;
	category?: string;
	content: string;
	changeNote?: string | null;
}

export interface UpdatePromptInput extends UserInput {
	promptId: string;
	displayName: string;
	category: string | null;
	content: string;
	changeNote?: string | null;
}

export type PromptVersionWithRelations = PromptVersion & {
	Editor: User;
	Prompt: Prompt;
};

export interface PromptWithLatest {
	id: string;
	displayName: string;
	category: string;
	content: string;
	changeNote: string | null;
}
