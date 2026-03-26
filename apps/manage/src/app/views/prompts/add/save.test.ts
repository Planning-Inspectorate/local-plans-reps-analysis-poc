import { describe, it, mock, type Mock } from 'node:test';
import assert from 'node:assert/strict';
import { mockLogger } from '@pins/local-plans-reps-analysis-poc-lib/testing/mock-logger.ts';
import { buildSaveController } from './save.ts';
import type { Request, Response } from 'express';
import type { ManageService } from '#service';

describe('Add Prompt Save Controller', () => {
	const mockAnswers = {
		displayName: 'Test Prompt',
		category: 'general',
		content: 'This is a test prompt',
		changeNote: 'Initial version'
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
				createPrompt: mock.fn(async () => {}),
				...overrides
			}
		}) as unknown as ManageService;

	const createMockReq = (overrides: Record<string, any> = {}) =>
		({
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

	it('should successfully create a prompt and redirect to /manage-prompts', async () => {
		const createPrompt = mock.fn(async () => {});
		const service = setupService({ createPrompt });
		const mockReq = createMockReq();
		const { res, redirect } = createMockRes();

		const handler = buildSaveController(service);
		// @ts-ignore
		await handler(mockReq, res);

		assert.strictEqual(createPrompt.mock.callCount(), 1);

		// @ts-ignore
		const createArgs = createPrompt.mock.calls[0]!.arguments[0] as unknown as Record<string, string>;
		assert.strictEqual(createArgs.displayName, mockAnswers.displayName);
		assert.strictEqual(createArgs.category, mockAnswers.category);
		assert.strictEqual(createArgs.content, mockAnswers.content);
		assert.strictEqual(createArgs.changeNote, mockAnswers.changeNote);
		assert.strictEqual(createArgs.entraId, mockIdTokenClaims.oid);
		assert.strictEqual(createArgs.fullName, mockIdTokenClaims.name);
		assert.strictEqual(createArgs.email, mockIdTokenClaims.preferred_username);

		const redirectUrl = redirect.mock.calls[0]!.arguments[0] as unknown as string;
		assert.strictEqual(redirectUrl, '/manage-prompts');
	});

	it('should store lastRequest status in the session after creating', async () => {
		const service = setupService();
		const mockReq = createMockReq();
		const { res } = createMockRes();

		const handler = buildSaveController(service);
		// @ts-ignore
		await handler(mockReq, res);

		// @ts-ignore
		assert.deepStrictEqual(mockReq.session.persistence?.lastRequest, { status: 'added' });
	});

	it('should render 500 error page if createPrompt throws', async () => {
		const service = setupService({
			createPrompt: mock.fn(async () => {
				throw new Error('database error');
			})
		});
		const mockReq = createMockReq();
		const { res, render } = createMockRes();

		const handler = buildSaveController(service);
		// @ts-ignore
		await handler(mockReq, res);

		const call = render.mock.calls[0]!;
		const view = call.arguments[0] as string;
		const model = call.arguments[1] as unknown as { backLink: string };

		assert.strictEqual(view, 'views/errors/500.njk');
		assert.strictEqual(model.backLink, '/manage-prompts');
	});
});
