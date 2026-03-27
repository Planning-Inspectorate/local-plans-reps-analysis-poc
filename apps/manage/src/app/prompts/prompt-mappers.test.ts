import { describe, it } from 'node:test';
import assert from 'node:assert';
import { toViewPromptSummary, toViewPromptDetail, toViewPromptVersion } from './prompt-mappers.ts';
import type {
	PromptSummary,
	PromptDetail,
	PromptVersionWithRelations
} from '@pins/local-plans-reps-analysis-poc-lib/data/interface.ts';

describe('Prompt Mappers', () => {
	describe('toViewPromptSummary', () => {
		it('should capitalise display name, category, and author', () => {
			const prompt: PromptSummary = {
				id: 'p1',
				displayName: 'welcome message',
				createdAt: new Date('2025-01-15T00:00:00Z'),
				Author: { fullName: 'sarah jane' },
				Category: { name: 'general' },
				CurrentVersion: { id: 'v1', createdAt: new Date('2025-01-15'), changeNote: 'initial' }
			};

			const result = toViewPromptSummary(prompt);

			assert.strictEqual(result.displayName, 'Welcome Message');
			assert.strictEqual(result.authorName, 'Sarah Jane');
			assert.strictEqual(result.category, 'General');
			assert.strictEqual(result.id, 'p1');
		});

		it('should handle null relations gracefully', () => {
			const prompt: PromptSummary = {
				id: 'p2',
				displayName: 'test',
				createdAt: new Date(),
				Author: null,
				Category: null,
				CurrentVersion: null
			};

			const result = toViewPromptSummary(prompt);

			assert.strictEqual(result.authorName, '');
			assert.strictEqual(result.category, '');
		});
	});

	describe('toViewPromptDetail', () => {
		it('should flatten prompt with current version into view model', () => {
			const prompt: PromptDetail = {
				id: 'p1',
				displayName: 'My Prompt',
				CurrentVersion: { content: 'Hello world', changeNote: 'first draft' },
				Category: { name: 'analysis' }
			};

			const result = toViewPromptDetail(prompt);

			assert.strictEqual(result.id, 'p1');
			assert.strictEqual(result.displayName, 'My Prompt');
			assert.strictEqual(result.category, 'analysis');
			assert.strictEqual(result.content, 'Hello world');
			assert.strictEqual(result.changeNote, 'first draft');
		});

		it('should handle null current version and category', () => {
			const prompt: PromptDetail = {
				id: 'p2',
				displayName: 'Empty Prompt',
				CurrentVersion: null,
				Category: null
			};

			const result = toViewPromptDetail(prompt);

			assert.strictEqual(result.content, '');
			assert.strictEqual(result.category, '');
			assert.strictEqual(result.changeNote, '');
		});
	});

	describe('toViewPromptVersion', () => {
		it('should add formatted display fields to version', () => {
			const prompt = {
				id: 'v1',
				content: 'Version 1 content',
				createdAt: new Date('2025-06-01T10:00:00Z'),
				changeNote: 'initial version',
				promptId: 'p1',
				editorId: 'u1',
				Editor: { id: 'u1', fullName: 'elizabeth bennet', entraId: 'e1', email: 'e@test.com', roleId: 'r1' },
				Prompt: {
					id: 'p1',
					displayName: 'Case Officer Summary Tool',
					createdAt: new Date(),
					categoryId: 'c1',
					authorId: 'u1',
					currentVersionId: 'v1'
				}
			} as unknown as PromptVersionWithRelations;

			const result = toViewPromptVersion(prompt);

			assert.strictEqual(result.displayName, 'Case Officer Summary Tool');
			assert.strictEqual(result.authorName, 'Elizabeth Bennet');
			assert.ok(result.createdAtDisplay);
			// original fields preserved
			assert.strictEqual(result.content, 'Version 1 content');
			assert.strictEqual(result.id, 'v1');
		});
	});
});
