/**
 * Client for fetching prompt data from the Prisma database for the application,
 *
 * @module PromptsClient
 */

import type { PrismaClient, Prompt, PromptVersion, User } from '@pins/service-name-database/src/client/client.ts';
import type { CreatePromptInput, PromptSummary, UpdatePromptInput } from '../interface.ts';

export class PromptsClient {
	#client: PrismaClient;

	constructor(dbClient: PrismaClient) {
		this.#client = dbClient;
	}

	/** List all prompts with author and latest version metadata */
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
			displayName: p.displayName,
			category: p.Category ? p.Category.name : null,
			createdAt: p.createdAt,
			author: { id: p.Author.id, fullName: p.Author.fullName ?? '', email: p.Author.email ?? '' },
			latestVersion: p.CurrentVersion
				? {
						id: p.CurrentVersion.id,
						createdAt: p.CurrentVersion.createdAt,
						changeNote: p.CurrentVersion.changeNote ?? null
					}
				: undefined
		}));
	}

	/** Get a prompt by id with full latest content */
	async getPromptById(id: string): Promise<(Prompt & { Author: User; latestVersion?: PromptVersion }) | null> {
		const prompt = await this.#client.prompt.findUnique({
			where: { id },
			include: {
				Author: true,
				CurrentVersion: true
			}
		});
		if (!prompt) return null;
		const latestVersion = prompt.CurrentVersion as PromptVersion | undefined;
		return { ...prompt, latestVersion } as Prompt & { Author: User; latestVersion?: PromptVersion };
	}

	/** Create a new prompt and its initial version */
	async createPrompt(input: CreatePromptInput): Promise<Prompt> {
		// Ensure uniqueness is enforced by DB; Prisma will throw if conflict
		const created = await this.#client.prompt.create({
			data: {
				// schema removed slug; do not persist it
				displayName: input.displayName,
				Category: input.category
					? { connect: { name: input.category } } // Category.name is unique
					: undefined,
				Author: { connect: { id: input.editorUserId } },
				History: {
					create: {
						content: input.content,
						changeNote: input.changeNote ?? null,
						Editor: { connect: { id: input.editorUserId } }
					}
				}
			}
		});
		return created;
	}

	/** Update a prompt by adding a new version (immutable history) */
	async updatePrompt(input: UpdatePromptInput): Promise<PromptVersion> {
		// Verify prompt exists
		const prompt = await this.#client.prompt.findUnique({ where: { id: input.promptId } });
		if (!prompt) {
			throw new Error(`Prompt not found: ${input.promptId}`);
		}
		const version = await this.#client.promptVersion.create({
			data: {
				content: input.content,
				changeNote: input.changeNote ?? null,
				Prompt: { connect: { id: input.promptId } },
				Editor: { connect: { id: input.editorUserId } }
			}
		});

		// Optionally update the CurrentVersion pointer to the newly created version
		await this.#client.prompt.update({
			where: { id: input.promptId },
			data: { CurrentVersion: { connect: { id: version.id } } }
		});
		return version;
	}

	/** List prompt categories */
	async listPromptCategories(): Promise<string[]> {
		const categories = await this.#client.category.findMany({
			orderBy: { name: 'asc' }
		});
		return categories.map((c) => c.name);
	}

	/** List full history (versions) for a prompt */
	async listPromptHistory(promptId: string): Promise<PromptVersion[]> {
		return this.#client.promptVersion.findMany({
			where: { promptId },
			orderBy: { createdAt: 'desc' },
			include: { Editor: true }
		});
	}

	/** Delete a prompt and its history (dangerous in non-PoC). For PoC only. */
	async deletePrompt(promptId: string): Promise<void> {
		// Delete child versions first to satisfy FK constraints if onDelete is NoAction
		await this.#client.promptVersion.deleteMany({ where: { promptId } });
		await this.#client.prompt.delete({ where: { id: promptId } });
	}
}
