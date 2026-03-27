import type {
	Prisma,
	Prompt,
	PromptVersion,
	User
} from '@pins/local-plans-reps-analysis-poc-database/src/client/client.ts';

export type PromptSummary = Prisma.PromptGetPayload<{
	include: { Author: true; Category: true; CurrentVersion: true };
}>;

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

export type PromptDetail = Prisma.PromptGetPayload<{
	include: { CurrentVersion: true; Category: true };
}>;
