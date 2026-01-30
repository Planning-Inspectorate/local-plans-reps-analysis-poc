export interface PromptSummary {
	id: string;
	displayName: string;
	category?: string | null;
	createdAt: Date;
	author: { id: string; fullName: string; email: string };
	latestVersion?: {
		id: string;
		createdAt: Date;
		changeNote?: string | null;
	};
}

export interface CreatePromptInput {
	displayName: string;
	category?: string | null;
	content: string;
	changeNote?: string | null;
	editorUserId: string; // also set as author for initial version
}

export interface UpdatePromptInput {
	promptId: string;
	content: string;
	changeNote?: string | null;
	editorUserId: string;
}
