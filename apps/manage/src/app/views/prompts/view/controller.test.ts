import { describe, it, mock, type Mock } from 'node:test';
import assert from 'node:assert/strict';
import { mockLogger } from '@pins/local-plans-reps-analysis-poc-lib/testing/mock-logger.ts';
import {
	buildGetJourneyMiddleware,
	clearChangeNoteMiddleware,
	fetchPromptCategoriesMiddleware,
	managePromptMiddleware
} from './controller.ts';
import type { Request, Response, NextFunction } from 'express';
import type { ManageService } from '#service';

describe('View Prompt Controller Middleware', () => {
	const promptId = '722f466b-4f70-4f51-9311-8408107957e1';

	const setupService = (overrides = {}) =>
		({
			logger: mockLogger(),
			promptClient: {
				getPromptById: mock.fn(),
				getPromptCategories: mock.fn(),
				...overrides
			}
		}) as unknown as ManageService;

	const createMockNext = () => mock.fn() as Mock<NextFunction>;

	const createMockReq = (overrides: Record<string, any> = {}) =>
		({
			params: {},
			session: {},
			...overrides
		}) as unknown as Request;

	const createMockRes = (overrides: Record<string, any> = {}) => {
		const render = mock.fn() as Mock<Response['render']>;
		const status = mock.fn(() => ({ render })) as unknown as Mock<Response['status']>;
		const res = { status, render, locals: {}, ...overrides } as unknown as Response;
		return { res, render, status };
	};

	const createMockPromptData = (overrides: Record<string, any> = {}) => ({
		id: promptId,
		displayName: 'Test Prompt',
		Category: { name: 'general' },
		CurrentVersion: { content: 'Prompt body', changeNote: '' },
		...overrides
	});

	describe('buildGetJourneyMiddleware', () => {
		it('should fetch a prompt by id and attach journeyResponse to res.locals', async () => {
			const mockPrompt = createMockPromptData({ CurrentVersion: { content: 'Prompt body', changeNote: 'Initial' } });
			const getPromptById = mock.fn(async () => mockPrompt);
			const service = setupService({ getPromptById });

			const mockReq = createMockReq({ params: { id: promptId } });
			const { res } = createMockRes();
			const next = createMockNext();

			const handler = buildGetJourneyMiddleware(service);
			await handler(mockReq, res, next);

			assert.strictEqual(getPromptById.mock.callCount(), 1);
			assert.strictEqual((getPromptById.mock.calls[0]!.arguments as unknown[])[0], promptId);
			assert.ok(res.locals.journeyResponse);
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should merge session answers with prompt data', async () => {
			const mockPrompt = createMockPromptData({
				displayName: 'Original Name',
				CurrentVersion: { content: 'Original content', changeNote: '' }
			});
			const getPromptById = mock.fn(async () => mockPrompt);
			const service = setupService({ getPromptById });

			const sessionAnswers = { displayName: 'Session Override' };
			const mockReq = createMockReq({
				params: { id: promptId },
				session: { forms: { 'prompt-view': sessionAnswers } }
			});
			const { res } = createMockRes();
			const next = createMockNext();

			const handler = buildGetJourneyMiddleware(service);
			await handler(mockReq, res, next);

			const journeyResponse = res.locals.journeyResponse;
			assert.ok(journeyResponse);
			assert.strictEqual(journeyResponse.answers.displayName, 'Session Override');
			assert.strictEqual(journeyResponse.answers.content, 'Original content');
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should render 404 if the prompt does not exist', async () => {
			const getPromptById = mock.fn(async () => null);
			const service = setupService({ getPromptById });

			const mockReq = createMockReq({ params: { id: promptId } });
			const { res, status, render } = createMockRes();
			const next = createMockNext();

			const handler = buildGetJourneyMiddleware(service);
			await handler(mockReq, res, next);

			assert.strictEqual(status.mock.callCount(), 1);
			assert.strictEqual(status.mock.calls[0]!.arguments[0], 404);
			assert.strictEqual(render.mock.calls[0]!.arguments[0], 'views/errors/404.njk');
			assert.strictEqual(next.mock.callCount(), 0);
		});

		it('should throw if id param is missing', async () => {
			const service = setupService();

			const mockReq = createMockReq();
			const { res } = createMockRes();
			const next = createMockNext();

			const handler = buildGetJourneyMiddleware(service);

			await assert.rejects(async () => handler(mockReq, res, next), {
				message: 'Prompt id is required'
			});
		});

		it('should use empty object when no session forms exist', async () => {
			const mockPrompt = createMockPromptData({
				displayName: 'Prompt',
				CurrentVersion: { content: 'Content', changeNote: '' }
			});
			const getPromptById = mock.fn(async () => mockPrompt);
			const service = setupService({ getPromptById });

			const mockReq = createMockReq({ params: { id: promptId } });
			const { res } = createMockRes();
			const next = createMockNext();

			const handler = buildGetJourneyMiddleware(service);
			await handler(mockReq, res, next);

			const journeyResponse = res.locals.journeyResponse;
			assert.ok(journeyResponse);
			assert.strictEqual(journeyResponse.answers.displayName, 'Prompt');
			assert.strictEqual(next.mock.callCount(), 1);
		});
	});

	describe('clearChangeNoteMiddleware', () => {
		it('should clear changeNote in session for display-name question', () => {
			const mockReq = createMockReq({ params: { question: 'display-name' } });
			const next = createMockNext();

			clearChangeNoteMiddleware(mockReq, createMockRes().res, next);

			// @ts-ignore
			assert.strictEqual(mockReq.session.forms['prompt-view'].changeNote, '');
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should clear changeNote in session for category question', () => {
			const mockReq = createMockReq({ params: { question: 'category' } });
			const next = createMockNext();

			clearChangeNoteMiddleware(mockReq, createMockRes().res, next);

			// @ts-ignore
			assert.strictEqual(mockReq.session.forms['prompt-view'].changeNote, '');
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should clear changeNote in session for content question', () => {
			const mockReq = createMockReq({ params: { question: 'content' } });
			const next = createMockNext();

			clearChangeNoteMiddleware(mockReq, createMockRes().res, next);

			// @ts-ignore
			assert.strictEqual(mockReq.session.forms['prompt-view'].changeNote, '');
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should not modify session for untracked question URLs', () => {
			const mockReq = createMockReq({ params: { question: 'change-note' } });
			const next = createMockNext();

			clearChangeNoteMiddleware(mockReq, createMockRes().res, next);

			// @ts-ignore
			assert.strictEqual(mockReq.session.forms, undefined);
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should preserve existing session forms data', () => {
			const mockReq = createMockReq({
				params: { question: 'display-name' },
				session: {
					forms: {
						'prompt-view': { displayName: 'Existing', changeNote: 'Old note' }
					}
				}
			});
			const next = createMockNext();

			clearChangeNoteMiddleware(mockReq, createMockRes().res, next);

			// @ts-ignore
			assert.strictEqual(mockReq.session.forms['prompt-view'].changeNote, '');
			// @ts-ignore
			assert.strictEqual(mockReq.session.forms['prompt-view'].displayName, 'Existing');
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should always call next', () => {
			const mockReq = createMockReq({ params: { question: 'unknown' } });
			const next = createMockNext();

			clearChangeNoteMiddleware(mockReq, createMockRes().res, next);

			assert.strictEqual(next.mock.callCount(), 1);
		});
	});

	describe('fetchPromptCategoriesMiddleware', () => {
		it('should fetch categories and attach them to res.locals', async () => {
			const categories = ['general', 'summary', 'analysis'];
			const getPromptCategories = mock.fn(async () => categories);
			const service = setupService({ getPromptCategories });

			const { res } = createMockRes();
			const next = createMockNext();

			const handler = fetchPromptCategoriesMiddleware(service);
			await handler(createMockReq(), res, next);

			assert.strictEqual(getPromptCategories.mock.callCount(), 1);
			assert.deepStrictEqual(res.locals.promptCategories, categories);
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should attach an empty array when no categories exist', async () => {
			const getPromptCategories = mock.fn(async () => []);
			const service = setupService({ getPromptCategories });

			const { res } = createMockRes();
			const next = createMockNext();

			const handler = fetchPromptCategoriesMiddleware(service);
			await handler(createMockReq(), res, next);

			assert.deepStrictEqual(res.locals.promptCategories, []);
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should call next with error when getPromptCategories throws', async () => {
			const getPromptCategories = mock.fn(async () => {
				throw new Error('db failure');
			});
			const service = setupService({ getPromptCategories });

			const next = createMockNext();

			const handler = fetchPromptCategoriesMiddleware(service);
			handler(createMockReq(), createMockRes().res, next);

			await new Promise((resolve) => setTimeout(resolve, 0));

			assert.strictEqual(next.mock.callCount(), 1);
			const errorArg = next.mock.calls[0]!.arguments[0] as unknown;
			assert.ok(errorArg instanceof Error);
			assert.strictEqual(errorArg.message, 'db failure');
		});
	});

	describe('managePromptMiddleware', () => {
		it('should set res.locals.isManagePrompt to true and call next', () => {
			const { res } = createMockRes();
			const next = createMockNext();

			managePromptMiddleware(createMockReq(), res, next);

			assert.strictEqual(res.locals.isManagePrompt, true);
			assert.strictEqual(next.mock.callCount(), 1);
		});

		it('should not overwrite other res.locals properties', () => {
			const { res } = createMockRes({ locals: { existingProp: 'keep-me' } });
			const next = createMockNext();

			managePromptMiddleware(createMockReq(), res, next);

			assert.strictEqual(res.locals.isManagePrompt, true);
			assert.strictEqual((res.locals as any).existingProp, 'keep-me');
			assert.strictEqual(next.mock.callCount(), 1);
		});
	});
});
