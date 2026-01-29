import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { CachedPromptsClient } from './cached-prompts-client.ts';
import { MapCache } from '../../util/map-cache.ts';
import type { PromptSummary } from '../interface.ts';
import type { Prompt, PromptVersion, User } from '@pins/service-name-database/src/client/client.ts';

// Helper type for typed mock functions
type MockFn<T extends (...args: any[]) => any> = ReturnType<typeof mock.fn<T>>;

// Client shape constrained to methods used in cached-prompts-client.ts
interface UnderlyingClient {
	getAllPrompts: MockFn<() => Promise<PromptSummary[]>>;
	getPromptById: MockFn<(id: string) => Promise<(Prompt & { Author: User; latestVersion?: PromptVersion }) | null>>;
	listPromptCategories: MockFn<() => Promise<string[]>>;
	listPromptHistory: MockFn<(promptId: string) => Promise<PromptVersion[]>>;
	deletePrompt: MockFn<(promptId: string) => Promise<void>>;
}

function makePromptSummary(overrides: Partial<PromptSummary> = {}): PromptSummary {
	return {
		id: 'p1',
		displayName: 'Welcome',
		category: 'general',
		createdAt: new Date('2025-01-01T00:00:00Z'),
		author: { id: 'u1', fullName: 'Tester', email: 'tester@example.com' },
		latestVersion: { id: 'v1', createdAt: new Date('2025-01-02T00:00:00Z'), changeNote: 'init' },
		...overrides
	};
}

describe('CachedPromptsClient', () => {
	let underlying: UnderlyingClient;
	let cache: MapCache;
	let client: CachedPromptsClient;

	beforeEach(() => {
		underlying = {
			getAllPrompts: mock.fn(async () => [makePromptSummary()]),
			getPromptById: mock.fn(
				async () =>
					({
						id: 'p1',
						displayName: 'Welcome',
						createdAt: new Date('2025-01-01T00:00:00Z'),
						Author: { id: 'u1', fullName: 'Tester', email: 'tester@example.com' } as User,
						latestVersion: { id: 'v1', createdAt: new Date('2025-01-02T00:00:00Z') } as PromptVersion
					}) as unknown as Prompt & { Author: User; latestVersion?: PromptVersion }
			),
			listPromptCategories: mock.fn(async () => ['alpha', 'beta']),
			listPromptHistory: mock.fn(async () => [
				{ id: 'v2', createdAt: new Date('2025-01-03T00:00:00Z') } as PromptVersion,
				{ id: 'v1', createdAt: new Date('2025-01-02T00:00:00Z') } as PromptVersion
			]),
			deletePrompt: mock.fn(async () => {})
		};
		cache = new MapCache(60);
		client = new CachedPromptsClient(underlying as unknown as any, cache);
	});

	it('should getAllPrompts caches results after first call', async () => {
		const first = await client.getAllPrompts();
		const second = await client.getAllPrompts();
		assert.strictEqual(first.length, 1);
		assert.strictEqual(second.length, 1);
		assert.strictEqual(underlying.getAllPrompts.mock.callCount(), 1);
	});

	it('should getPromptById caches the result including null distinctly', async () => {
		const a = await client.getPromptById('p1');
		await client.getPromptById('p1');
		assert.ok(a);
		assert.strictEqual(underlying.getPromptById.mock.callCount(), 1);

		underlying.getPromptById = mock.fn(async () => null);
		const c = await client.getPromptById('missing');
		await client.getPromptById('missing');
		assert.strictEqual(c, null);
		assert.strictEqual(underlying.getPromptById.mock.callCount(), 1);
	});

	it('should listPromptCategories caches results after first call', async () => {
		const first = await client.listPromptCategories();
		const second = await client.listPromptCategories();
		assert.deepStrictEqual(first, ['alpha', 'beta']);
		assert.deepStrictEqual(second, ['alpha', 'beta']);
		assert.strictEqual(underlying.listPromptCategories.mock.callCount(), 1);
	});

	it('should listPromptHistory caches history for promptId', async () => {
		const a = await client.listPromptHistory('p1');
		await client.listPromptHistory('p1');
		assert.strictEqual(a.length, 2);
		assert.strictEqual(underlying.listPromptHistory.mock.callCount(), 1);
	});

	it('should deletePrompt updates list cache and invalidates specific prompt caches', async () => {
		// warm list cache with two items
		await client.getAllPrompts();
		const listKey = 'prompts_getAllPrompts';
		const cur = cache.get(listKey) as PromptSummary[];
		cache.set(listKey, [makePromptSummary({ id: 'p2' }), ...cur]);

		await client.deletePrompt('p2');
		assert.strictEqual(underlying.deletePrompt.mock.callCount(), 1);
		const list = await client.getAllPrompts();
		assert.strictEqual(list.length, 1);
		assert.strictEqual(list[0].id, 'p1');
	});
});
