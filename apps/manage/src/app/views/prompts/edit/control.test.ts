import { describe, it, mock, type Mock } from 'node:test';
import assert from 'node:assert/strict';
import { mockLogger } from '@pins/local-plans-reps-analysis-poc-lib/testing/mock-logger.ts';
import { buildEditFn } from './controller.ts';
import type { Request, Response } from 'express';
import type { ManageService } from '#service';

describe('Edit Prompt Controller', () => {
	const promptId = '722f466b-4f70-4f51-9311-8408107957e1';

	const mockAnswers = {
		displayName: 'Updated Prompt',
		category: 'general',
		content: 'Updated content',
		changeNote: 'Revised wording'
	};

	const mockIdTokenClaims = {
		oid: 'entra-id-123',
		name: 'Test User',
		preferred_username: 'test@example.com'
	};

	const setupService = (overrides = {}) =>
		({
			logger: mockLogger(),
			promptClient: {
				updatePrompt: mock.fn(async () => {}),
				...overrides
			}
		}) as unknown as ManageService;

	const createMockReq = (overrides: Record<string, any> = {}) =>
		({
			params: { id: promptId },
			session: {
				account: {
					idTokenClaims: mockIdTokenClaims
				}
			},
			...overrides
		}) as unknown as Request;

	const createMockRes = (journeyResponse = { answers: mockAnswers }) => {
		const redirect = mock.fn() as Mock<Response['redirect']>;
		const render = mock.fn() as Mock<Response['render']>;
		return {
			res: { redirect, render, locals: { journeyResponse } } as unknown as Response,
			redirect,
			render
		};
	};

	it('should successfully update a prompt and redirect to /manage-prompts', async () => {
		const updatePrompt = mock.fn(async () => {});
		const service = setupService({ updatePrompt });
		const mockReq = createMockReq();
		const { res, redirect } = createMockRes();

		const handler = buildEditFn(service);
		// @ts-ignore
		await handler(mockReq, res);

		assert.strictEqual(updatePrompt.mock.callCount(), 1);

		// @ts-ignore
		const updateArgs = updatePrompt.mock.calls[0]!.arguments[0] as unknown as Record<string, string>;
		assert.strictEqual(updateArgs.promptId, promptId);
		assert.strictEqual(updateArgs.displayName, mockAnswers.displayName);
		assert.strictEqual(updateArgs.category, mockAnswers.category);
		assert.strictEqual(updateArgs.content, mockAnswers.content);
		assert.strictEqual(updateArgs.changeNote, mockAnswers.changeNote);
		assert.strictEqual(updateArgs.entraId, mockIdTokenClaims.oid);
		assert.strictEqual(updateArgs.fullName, mockIdTokenClaims.name);
		assert.strictEqual(updateArgs.email, mockIdTokenClaims.preferred_username);

		const redirectUrl = redirect.mock.calls[0]!.arguments[0] as unknown as string;
		assert.strictEqual(redirectUrl, '/manage-prompts');
	});

	it('should store lastRequest status as updated in the session', async () => {
		const service = setupService();
		const mockReq = createMockReq();
		const { res } = createMockRes();

		const handler = buildEditFn(service);
		// @ts-ignore
		await handler(mockReq, res);

		// @ts-ignore
		assert.deepStrictEqual(mockReq.session.persistence?.lastRequest, { status: 'updated' });
	});

	it('should default changeNote to empty string when not provided', async () => {
		const updatePrompt = mock.fn(async () => {});
		const service = setupService({ updatePrompt });
		const mockReq = createMockReq();
		const { res } = createMockRes({
			answers: {
				displayName: 'Prompt',
				category: 'general',
				content: 'Content'
			}
		} as any);

		const handler = buildEditFn(service);
		// @ts-ignore
		await handler(mockReq, res);

		// @ts-ignore
		const updateArgs = updatePrompt.mock.calls[0]!.arguments[0] as unknown as Record<string, string>;
		assert.strictEqual(updateArgs.changeNote, '');
	});

	it('should default answers to empty object when journeyResponse has no answers', async () => {
		const updatePrompt = mock.fn(async () => {});
		const service = setupService({ updatePrompt });
		const mockReq = createMockReq();
		const { res } = createMockRes({} as any);

		const handler = buildEditFn(service);
		// @ts-ignore
		await handler(mockReq, res);

		// @ts-ignore
		const updateArgs = updatePrompt.mock.calls[0]!.arguments[0] as unknown as Record<string, string>;
		assert.strictEqual(updateArgs.displayName, undefined);
		assert.strictEqual(updateArgs.changeNote, '');
	});

	it('should throw if updatePrompt throws', async () => {
		const service = setupService({
			updatePrompt: mock.fn(async () => {
				throw new Error('database error');
			})
		});
		const mockReq = createMockReq();
		const { res } = createMockRes();

		const handler = buildEditFn(service);

		// @ts-ignore
		await assert.rejects(() => handler(mockReq, res), {
			message: 'database error'
		});
	});

	it('should log the error when updatePrompt fails', async () => {
		const logger = mockLogger();
		const service = {
			logger,
			promptClient: {
				updatePrompt: mock.fn(async () => {
					throw new Error('boom');
				})
			}
		} as unknown as ManageService;
		const mockReq = createMockReq();
		const { res } = createMockRes();

		const handler = buildEditFn(service);

		// @ts-ignore
		await assert.rejects(() => handler(mockReq, res));

		assert.strictEqual(logger.error.mock.callCount(), 1);
	});
});
