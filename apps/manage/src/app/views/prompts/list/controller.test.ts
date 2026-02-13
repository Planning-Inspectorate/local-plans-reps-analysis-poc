import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { buildViewPrompts } from './controller.ts';
import { configureNunjucks } from '../../../nunjucks.ts';
import { mockLogger } from '@pins/local-plans-reps-analysis-poc-lib/testing/mock-logger.ts';
import type { ManageService } from '#service';
import type { PromptSummary } from '@pins/local-plans-reps-analysis-poc-lib/data/interface.ts';
import type { Request, Response } from 'express';

describe('views/prompts/list/controller', () => {
	it('GET buildViewPrompts should fetch prompts and render view', async () => {
		const nunjucks = configureNunjucks();
		const render = mock.fn((view, data) => nunjucks.render(view, data));
		const mockRes: Partial<Response> = { render: render as Response['render'] };
		// @ts-ignore
		const mockReq: Partial<Request> = { query: {}, session: {} };

		const prompts: PromptSummary[] = [
			{
				id: '550e8400-e29b-41d4-a716-446655440000',
				displayName: 'example',
				category: 'general',
				createdAt: new Date('2024-01-01T00:00:00Z'),
				authorName: 'sarah-jane'
			}
		];

		const getAllPrompts = mock.fn(async () => prompts);

		const mockService = {
			logger: mockLogger(),
			promptClient: { getAllPrompts }
		} as unknown as ManageService;

		const handler = buildViewPrompts(mockService);

		await handler(mockReq as Request, mockRes as Response);
		assert.strictEqual(render.mock.callCount(), 1);
		assert.strictEqual(getAllPrompts.mock.callCount(), 1);

		assert.strictEqual(render.mock.callCount(), 1);
		assert.strictEqual(render.mock.calls[0].arguments[0], 'views/prompts/list/view.njk');

		const model = render.mock.calls[0].arguments[1];
		assert.strictEqual(model.pageHeading, 'Manage Prompts');
		assert.deepStrictEqual(model.prompts, prompts);
		// controller reads status with a default of '' when not set; expect empty string
		assert.strictEqual(model.status, '');
	});
});
