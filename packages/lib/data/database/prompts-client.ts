/**
 * Client for fetching prompt data from the Prisma database for the application,
 *
 * @module PromptsClient
 */

import type {
	Category,
	Prisma,
	PrismaClient,
	Prompt,
	PromptVersion,
	User
} from '@pins/local-plans-reps-analysis-poc-database/src/client/client.ts';
import type {
	CreatePromptInput,
	PromptSummary,
	PromptVersionWithRelations,
	PromptWithLatest,
	UpdatePromptInput
} from '../interface.d.ts';
import { capitalizeWords } from '../../util/string-helpers.ts';
import { formatDateForDisplay } from '../../util/date.ts';

export function buildInitPromptClient(dbClient: PrismaClient) {
	return new PromptsClient(dbClient);
}

export class PromptsClient {
	#client: PrismaClient;

	constructor(dbClient: PrismaClient) {
		this.#client = dbClient;
	}

	private async ensureUser(
		tx: Prisma.TransactionClient,
		input: { entraId: string; email?: string | null; fullName?: string | null }
	) {
		return tx.user.upsert({
			where: { entraId: input.entraId },
			update: {},
			create: {
				entraId: input.entraId,
				email: input.email,
				fullName: input.fullName,
				Role: { connect: { name: 'editor' } }
			}
		});
	}

	// List all prompts with author and latest version metadata
	async getAllPrompts(): Promise<PromptSummary[]> {
		const prompts = await this.#client.prompt.findMany({
			include: {
				Author: true,
				Category: true,
				CurrentVersion: true
			},
			orderBy: { createdAt: 'desc' }
		});

		return prompts.map((p) => ({
			id: p.id,
			displayName: capitalizeWords(p.displayName),
			category: capitalizeWords(p.Category?.name ?? ''),
			createdAt: formatDateForDisplay(p.createdAt ?? ''),
			authorName: capitalizeWords(p.Author?.fullName ?? ''),
			latestVersion: p.CurrentVersion
				? {
						id: p.CurrentVersion.id,
						createdAt: p.CurrentVersion.createdAt,
						changeNote: p.CurrentVersion.changeNote ?? null
					}
				: undefined
		}));
	}

	// Get a prompt by id with full latest content
	async getPromptById(id: string): Promise<PromptWithLatest | null> {
		const prompt = await this.#client.prompt.findUnique({
			where: { id },
			include: {
				Author: true,
				CurrentVersion: true,
				Category: true
			}
		});
		if (!prompt) return null;
		const latestVersion = prompt.CurrentVersion as PromptVersion | undefined;
		return { ...prompt, latestVersion } as Prompt & {
			Author: User;
			latestVersion?: PromptVersion;
			Category?: Category;
		};
	}

	// Create a new prompt and its initial version
	async createPrompt(input: CreatePromptInput): Promise<Prompt> {
		return this.#client.$transaction(async (tx) => {
			const user = await this.ensureUser(tx, input);

			// Create the prompt
			const created = await tx.prompt.create({
				data: {
					displayName: input.displayName,
					Category: input.category ? { connect: { name: input.category } } : undefined,
					Author: { connect: { id: user.id } },
					History: {
						create: {
							content: input.content,
							changeNote: input.changeNote ?? null,
							Editor: { connect: { id: user.id } }
						}
					}
				},
				include: {
					History: true
				}
			});

			// prompt first version
			const firstVersion = created.History[0];

			await tx.prompt.update({
				where: { id: created.id },
				data: {
					CurrentVersion: { connect: { id: firstVersion.id } }
				}
			});

			return created;
		});
	}

	// Update a prompt by adding a new version (immutable history)
	async updatePrompt(input: UpdatePromptInput): Promise<PromptVersion> {
		return this.#client.$transaction(async (tx) => {
			const prompt = await tx.prompt.findUnique({
				where: { id: input.promptId }
			});
			if (!prompt) {
				throw new Error(`Prompt not found: ${input.promptId}`);
			}
			const user = await this.ensureUser(tx, input);
			const version = await tx.promptVersion.create({
				data: {
					content: input.content,
					changeNote: input.changeNote ?? null,
					Prompt: { connect: { id: input.promptId } },
					Editor: { connect: { id: user.id } }
				}
			});

			// Also update Prompt metadata (displayName, Category) so lists and edit views reflect latest changes
			await tx.prompt.update({
				where: { id: input.promptId },
				data: {
					displayName: input.displayName,
					Category: input.category ? { connect: { name: input.category } } : { disconnect: true },
					CurrentVersion: { connect: { id: version.id } }
				}
			});

			return version;
		});
	}

	// List prompt categories
	async listPromptCategories(): Promise<string[]> {
		const categories = await this.#client.category.findMany({
			orderBy: { name: 'asc' }
		});
		return categories.map((c) => c.name);
	}

	// List full history (versions) for a prompt
	async listPromptHistory(promptId: string): Promise<PromptVersionWithRelations[]> {
		const promptVersions = await this.#client.promptVersion.findMany({
			where: { promptId },
			orderBy: { createdAt: 'desc' },
			include: { Editor: true, Prompt: true }
		});

		return promptVersions.map((version) => ({
			...version,
			displayName: version.Prompt?.displayName ?? '',
			authorName: capitalizeWords(version.Editor?.fullName ?? ''),
			createdAtDisplay: formatDateForDisplay(version.createdAt ?? '')
		}));
	}

	// Delete a prompt and its history
	async deletePrompt(promptId: string): Promise<void> {
		await this.#client.$transaction(async (tx) => {
			await tx.prompt.update({
				where: { id: promptId },
				data: { currentVersionId: null }
			});

			await tx.promptVersion.deleteMany({
				where: { promptId }
			});

			await tx.prompt.delete({
				where: { id: promptId }
			});
		});
	}
}
