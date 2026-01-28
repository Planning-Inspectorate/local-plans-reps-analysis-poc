import { describe, it, mock, type Mock } from 'node:test';
import assert from 'node:assert/strict';
import { buildPromptVersionView } from './controller.ts';
import { mockLogger } from '@pins/local-plans-reps-analysis-poc-lib/testing/mock-logger.ts';
import { createMockUser } from '@pins/local-plans-reps-analysis-poc-lib/data/database/prompts-client.test.ts';
import type { Request, Response } from 'express';
import type { ManageService } from '#service';

describe('Prompt Version History Controller', () => {
	const validPromptId = '722f466b-4f70-4f51-9311-8408107957e1';

	describe('GET /manage-prompts/:id/versions', () => {
		it('should successfully retrieve and display the full version history for a specific prompt', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { render } as unknown as Response;
			const mockReq = { params: { id: validPromptId } } as unknown as Request;

			const mockHistory = [
				{
					id: '550e8400-e29b-41d4-a716-446655440000',
					content: 'Version 1 content',
					createdAt: new Date(),
					Prompt: { displayName: 'Case Officer Summary Tool' },
					Editor: createMockUser({ fullName: 'elizabeth bennet' })
				},
				{
					id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
					content: 'Version 2 content',
					createdAt: new Date(),
					Prompt: { displayName: 'Case Officer Summary Tool' },
					Editor: createMockUser({ fullName: 'fitzwilliam darcy' })
				}
			];

			const listPromptHistory = mock.fn(async (id: string) => {
				assert.strictEqual(id, validPromptId);
				return mockHistory;
			});

			const mockService = {
				logger: mockLogger(),
				promptClient: { listPromptHistory }
			} as unknown as ManageService;

			const handler = buildPromptVersionView(mockService);
			await handler(mockReq, mockRes);

			const call = render.mock.calls[0]!;
			const view = call.arguments[0] as string;
			const model = call.arguments[1] as any;

			assert.strictEqual(view, 'views/prompts/version/view.njk');
			assert.strictEqual(model.pageHeading, 'Prompt Version');
			assert.strictEqual(model.backLink, '/manage-prompts');
			assert.deepStrictEqual(model.promptVersion, mockHistory);
			assert.strictEqual(model.promptVersion[0].Editor.fullName, 'elizabeth bennet');
			assert.strictEqual(model.promptVersion[1].Editor.fullName, 'fitzwilliam darcy');
		});

		it('should render 404 page when the prompt ID does not exist', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const status = mock.fn(() => ({ render })) as unknown as Mock<Response['status']>;
			const mockRes = { status, render } as unknown as Response;
			const mockReq = { params: { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851' } } as unknown as Request;

			const listPromptHistory = mock.fn(async () => null);
			const mockService = {
				logger: mockLogger(),
				promptClient: { listPromptHistory }
			} as unknown as ManageService;

			const handler = buildPromptVersionView(mockService);
			await handler(mockReq, mockRes);

			const statusCall = status.mock.calls[0]!;
			assert.strictEqual(statusCall.arguments[0], 404);

			const renderCall = render.mock.calls[0]!;
			assert.strictEqual(renderCall.arguments[0], 'views/errors/404.njk');
			const errorModel = renderCall.arguments[1] as any;
			assert.strictEqual(errorModel.backLink, '/manage-prompts');
		});
	});
});
