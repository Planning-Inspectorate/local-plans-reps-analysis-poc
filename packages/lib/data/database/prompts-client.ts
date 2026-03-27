/**
 * Client for fetching prompt data from the Prisma database for the application,
 *
 * @module PromptsClient
 */

import type {
	Prisma,
	PrismaClient,
	Prompt,
	PromptVersion
} from '@pins/local-plans-reps-analysis-poc-database/src/client/client.ts';
import type {
	CreatePromptInput,
	PromptSummary,
	PromptVersionWithRelations,
	UpdatePromptInput,
	PromptDetail
} from '../interface.d.ts';

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
		return this.#client.prompt.findMany({
			include: {
				Author: {
					select: { fullName: true }
				},
				Category: {
					select: { name: true }
				},
				CurrentVersion: {
					select: {
						id: true,
						createdAt: true,
						changeNote: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});
	}

	// Get a prompt by id
	async getPromptById(id: string): Promise<PromptDetail | null> {
		return this.#client.prompt.findUnique({
			where: { id },
			include: {
				CurrentVersion: {
					select: {
						content: true,
						changeNote: true
					}
				},
				Category: {
					select: {
						name: true
					}
				}
			}
		});
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
	async getPromptCategories(): Promise<string[]> {
		const categories = await this.#client.category.findMany({
			orderBy: { name: 'asc' }
		});
		return categories.map((c) => c.name);
	}

	// List full history (versions) for a prompt
	async getPromptHistory(promptId: string): Promise<PromptVersionWithRelations[]> {
		return this.#client.promptVersion.findMany({
			where: { promptId },
			orderBy: { createdAt: 'desc' },
			include: { Editor: true, Prompt: true }
		});
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
