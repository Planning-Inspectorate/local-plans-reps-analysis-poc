import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import type { ManageService } from '#service';
import { loadPromptContext } from './prompt-context.ts';

describe('loadPromptContext', () => {
	it('returns null when prompt is not found', async () => {
		const mockService = {
			promptClient: {
				getPromptById: mock.fn(async () => null),
				listPromptCategories: mock.fn()
			}
		} as unknown as ManageService;

		const result = await loadPromptContext(mockService, '123');

		assert.strictEqual(result, null);
		// @ts-ignore
		assert.strictEqual(mockService.promptClient.getPromptById.mock.callCount(), 1);
		// @ts-ignore
		assert.strictEqual(mockService.promptClient.listPromptCategories.mock.callCount(), 0);
	});

	it('returns null when categories are not found', async () => {
		const prompt = {
			Category: { name: 'general' },
			displayName: 'Example',
			latestVersion: { content: 'Hello world' }
		};

		const mockService = {
			promptClient: {
				getPromptById: mock.fn(async () => prompt),
				listPromptCategories: mock.fn(async () => null)
			}
		} as unknown as ManageService;

		const result = await loadPromptContext(mockService, '123');

		assert.strictEqual(result, null);
		// @ts-ignore
		assert.strictEqual(mockService.promptClient.getPromptById.mock.callCount(), 1);

		// @ts-ignore
		assert.strictEqual(mockService.promptClient.listPromptCategories.mock.callCount(), 1);
	});

	it('returns prompt, categories, and current when all data exists', async () => {
		const prompt = {
			Category: { name: 'general' },
			displayName: 'Example',
			latestVersion: { content: 'Hello world' }
		};

		const categories = ['general', 'legal', 'technical'];

		const mockService = {
			promptClient: {
				getPromptById: mock.fn(async () => prompt),
				listPromptCategories: mock.fn(async () => categories)
			}
		} as unknown as ManageService;

		const result = await loadPromptContext(mockService, '123');

		assert.deepStrictEqual(result, {
			prompt,
			categories,
			current: {
				category: 'general',
				displayName: 'Example',
				content: 'Hello world'
			}
		});

		// @ts-ignore
		assert.strictEqual(mockService.promptClient.getPromptById.mock.callCount(), 1);
		// @ts-ignore
		assert.strictEqual(mockService.promptClient.listPromptCategories.mock.callCount(), 1);
	});

	it('handles missing optional fields gracefully', async () => {
		const prompt = {
			Category: undefined,
			displayName: undefined,
			latestVersion: undefined
		};

		const categories = ['general'];

		const mockService = {
			promptClient: {
				getPromptById: mock.fn(async () => prompt),
				listPromptCategories: mock.fn(async () => categories)
			}
		} as unknown as ManageService;

		const result = await loadPromptContext(mockService, '123');

		assert.deepStrictEqual(result, {
			prompt,
			categories,
			current: {
				category: '',
				displayName: '',
				content: ''
			}
		});
	});
});
