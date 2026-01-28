import type {
	Prompt,
	User,
	Category,
	PromptVersion
} from '@pins/local-plans-reps-analysis-poc-database/src/client/client.ts';

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

export interface CreatePromptInput extends CreateUserInput {
	displayName: string;
	category?: string | null;
	content: string;
	changeNote?: string | null;
}

export interface UpdatePromptInput {
	promptId: string;
	displayName: string;
	category: string | null; // or string if always present
	content: string;
	changeNote?: string | null;

	// Editor/user info
	entraId: string;
	fullName: string;
	email: string | null; // depends on your schema
}

export interface CreateUserInput {
	entraId: string;
	fullName?: string | null;
	email?: string | null;
}

export interface PromptVersionWithRelations {
	id: string;
	content: string;
	changeNote: string | null;
	createdAt: Date;
	promptId: string;
	editorId: string;
	Editor: Editor;
	Prompt: Prompt;
}

export interface Editor {
	id: string;
	entraId: string;
	email: string | null;
	fullName: string | null;
	roleId: string;
}

export interface PromptWithLatest extends Prompt {
	Author: User;
	latestVersion?: PromptVersion;
	Category?: Category;
}
