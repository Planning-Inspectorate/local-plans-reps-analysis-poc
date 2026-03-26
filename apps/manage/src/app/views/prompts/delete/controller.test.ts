import { describe, it, mock, type Mock } from 'node:test';
import assert from 'node:assert/strict';
import { mockLogger } from '@pins/local-plans-reps-analysis-poc-lib/testing/mock-logger.ts';
import { buildDeletePromptView, buildDeletePromptPost } from './controller.ts';
import { createMockPrompt } from '@pins/local-plans-reps-analysis-poc-lib/data/database/prompts-client.test.ts';
import type { Request, Response } from 'express';
import type { ManageService } from '#service';
import type { DeletePromptViewModel } from './interface.d.ts';

describe('Delete Prompt Controller', () => {
	const promptId = '722f466b-4f70-4f51-9311-8408107957e1';
	const setupService = (overrides = {}) =>
		({
			logger: mockLogger(),
			promptClient: {
				getPromptById: mock.fn(),
				deletePrompt: mock.fn(),
				...overrides
			}
		}) as unknown as ManageService;

	describe('GET buildDeletePromptView', () => {
		it('should render the confirmation page if the prompt exists', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { render } as unknown as Response;
			const mockReq = { params: { id: promptId } } as unknown as Request;

			const mockPrompt = createMockPrompt({ id: promptId, displayName: 'Delete Me' });
			const service = setupService({
				getPromptById: mock.fn(async () => mockPrompt)
			});

			const handler = buildDeletePromptView(service);
			await handler(mockReq, mockRes);

			const call = render.mock.calls[0]!;
			const view = call.arguments[0] as string;
			const model = call.arguments[1] as unknown as DeletePromptViewModel;

			assert.strictEqual(view, 'views/prompts/delete/view.njk');
			assert.strictEqual(model.pageHeading, 'Delete Prompt');
			assert.strictEqual(model.prompt?.id, promptId);
		});
		it('should render 404 error page if the prompt does not exist', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { render } as unknown as Response;
			const mockReq = { params: { id: promptId } } as unknown as Request;

			const service = setupService({
				getPromptById: mock.fn(async () => null)
			});

			const handler = buildDeletePromptView(service);
			await handler(mockReq, mockRes);

			const call = render.mock.calls[0]!;
			const view = call.arguments[0] as string;
			const model = call.arguments[1] as unknown as { backLink: string };

			assert.strictEqual(view, 'views/errors/404.njk');
			assert.strictEqual(model.backLink, '/manage-prompts');
		});
	});

	describe('POST buildDeletePromptPost', () => {
		it('should successfully delete the prompt and redirect to /manage-prompts', async () => {
			const mockRes = {
				redirect: mock.fn(),
				render: mock.fn()
			} as unknown as Response;

			// ensure session exists so addSessionData does not throw
			const mockReq = { params: { id: promptId }, session: {} } as unknown as Request;

			const deletePrompt = mock.fn(async () => {});

			const service = setupService({
				deletePrompt,
				getPromptById: mock.fn()
			});

			const handler = buildDeletePromptPost(service);
			await handler(mockReq, mockRes);

			assert.strictEqual(deletePrompt.mock.callCount(), 1);
			// @ts-ignore
			assert.strictEqual(deletePrompt.mock.calls[0]!.arguments[0], promptId);

			// @ts-ignore
			const redirectUrl = mockRes.redirect.mock.calls[0]!.arguments[0] as string;
			assert.strictEqual(redirectUrl, '/manage-prompts');
		});

		it('should render 500 error page if delete service throws', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { render } as unknown as Response;
			const mockReq = { params: { id: promptId } } as unknown as Request;

			const service = setupService({
				deletePrompt: mock.fn(async () => {
					throw new Error('boom');
				})
			});

			const handler = buildDeletePromptPost(service);
			await handler(mockReq, mockRes);

			const call = render.mock.calls[0]!;
			const view = call.arguments[0] as string;
			const model = call.arguments[1] as unknown as { backLink: string };

			assert.strictEqual(view, 'views/errors/500.njk');
			assert.strictEqual(model.backLink, '/manage-prompts');
		});
	});
});
