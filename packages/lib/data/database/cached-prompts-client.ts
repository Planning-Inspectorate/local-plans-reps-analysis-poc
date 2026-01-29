import { PromptsClient } from './prompts-client.ts';
import type { MapCache } from '../../util/map-cache.ts';
import type { PromptSummary } from '../interface.ts';
import type { PrismaClient, Prompt, PromptVersion, User } from '@pins/service-name-database/src/client/client.ts';

const CACHE_PREFIX = 'prompts_';

export function buildInitPromptClient(dbClient: PrismaClient, cache: MapCache) {
	const promptsClient = new PromptsClient(dbClient);
	return new CachedPromptsClient(promptsClient, cache);
}

export class CachedPromptsClient {
	#client: PromptsClient;
	#cache: MapCache;

	constructor(client: PromptsClient, cache: MapCache) {
		this.#client = client;
		this.#cache = cache;
	}

	/**
	 * List all prompts with author and latest version metadata (cached)
	 */
	async getAllPrompts(): Promise<PromptSummary[]> {
		const key = CACHE_PREFIX + 'getAllPrompts';
		const cached = this.#cache.get(key) as PromptSummary[] | undefined;
		if (cached) return cached;
		const prompts = await this.#client.getAllPrompts();
		this.#cache.set(key, prompts);
		return prompts;
	}

	/**
	 * Get a prompt by id with full latest content (cached)
	 */
	async getPromptById(id: string): Promise<(Prompt & { Author: User; latestVersion?: PromptVersion }) | null> {
		const key = CACHE_PREFIX + 'getPromptById_' + id;
		const cached = this.#cache.get(key) as
			| (Prompt & { Author: User; latestVersion?: PromptVersion })
			| null
			| undefined;
		if (cached !== undefined) return cached;
		const prompt = await this.#client.getPromptById(id);
		this.#cache.set(key, prompt);
		return prompt;
	}

	/**
	 * List prompt categories (cached)
	 */
	async listPromptCategories(): Promise<string[]> {
		const key = CACHE_PREFIX + 'listPromptCategories';
		const cached = this.#cache.get(key) as string[] | undefined;
		if (cached) return cached;
		const categories = await this.#client.listPromptCategories();
		this.#cache.set(key, categories);
		return categories;
	}

	/**
	 * List full history (versions) for a prompt (cached)
	 */
	async listPromptHistory(promptId: string): Promise<PromptVersion[]> {
		const key = CACHE_PREFIX + 'listPromptHistory_' + promptId;
		const cached = this.#cache.get(key) as PromptVersion[] | undefined;
		if (cached) return cached;
		const history = await this.#client.listPromptHistory(promptId);
		this.#cache.set(key, history);
		return history;
	}

	/**
	 * Delete a prompt and its history; update caches following project pattern
	 */
	async deletePrompt(promptId: string): Promise<void> {
		await this.#client.deletePrompt(promptId);

		const key = CACHE_PREFIX + 'getAllPrompts';
		let prompts = this.#cache.get(key) as PromptSummary[] | undefined;
		if (prompts) {
			prompts = prompts.filter((p) => p.id !== promptId);
			this.#cache.set(key, prompts);
		}

		this.#cache.set(key, prompts);
	}
}
