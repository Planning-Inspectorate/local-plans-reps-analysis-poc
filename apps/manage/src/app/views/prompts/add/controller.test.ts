import { describe, it, mock, type Mock } from 'node:test';
import assert from 'node:assert/strict';
import { mockLogger } from '@pins/local-plans-reps-analysis-poc-lib/testing/mock-logger.ts';
import { buildAddPromptView, buildAddPromptPost } from './controller.ts';
import type { Request, Response } from 'express';
import type { ManageService } from '#service';
import type { AddPromptViewModel } from './interface.d.ts';

describe('Add Prompt Controller', () => {
	const mockCategories = ['General', 'Technical', 'Legal'];
	const setupService = (overrides = {}) =>
		({
			logger: mockLogger(),
			promptClient: {
				listPromptCategories: mock.fn(async () => mockCategories),
				createPrompt: mock.fn(),
				...overrides
			}
		}) as unknown as ManageService;

	const mockSession = {
		account: {
			idTokenClaims: {
				oid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
				name: 'Jane Doe',
				preferred_username: 'jane.doe@example.com'
			}
		}
	};

	describe('GET buildAddPromptView', () => {
		it('should render the add prompt page with initialized categories', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { render } as unknown as Response;
			const mockReq = {} as Request;

			const service = setupService();
			const handler = buildAddPromptView(service);

			await handler(mockReq, mockRes);

			const call = render.mock.calls[0]!;
			const view = call.arguments[0] as string;
			const model = call.arguments[1] as unknown as AddPromptViewModel;

			assert.strictEqual(view, 'views/prompts/add/view.njk');
			assert.strictEqual(model.pageHeading, 'Add Prompt');
			assert.strictEqual(model.isEdit, false);
			assert.ok(model.categoriesItems.length > 0);
		});
	});

	describe('POST buildAddPromptPost', () => {
		const validBody = {
			displayName: 'New System Instruction',
			category: 'Technical',
			content: 'You are a helpful assistant...',
			changeNote: 'Initial version'
		};

		it('should call createPrompt and redirect to success notification when valid', async () => {
			const redirect = mock.fn() as Mock<Response['redirect']>;
			const mockRes = { redirect } as unknown as Response;
			const mockReq = {
				body: validBody,
				session: mockSession
			} as unknown as Request;

			const createPrompt = mock.fn(async () => {});
			const service = setupService({ createPrompt });

			const handler = buildAddPromptPost(service);
			await handler(mockReq, mockRes);

			// Verify service call with correct mapping from session and body
			// @ts-ignore
			const createArgs = createPrompt.mock.calls[0]!.arguments[0] as unknown as Record<string, string>;
			assert.strictEqual(createArgs.displayName, 'New System Instruction');
			assert.strictEqual(createArgs.category, 'Technical');
			assert.strictEqual(createArgs.fullName, 'Jane Doe');
			assert.strictEqual(createArgs.entraId, 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
			assert.strictEqual(createArgs.email, 'jane.doe@example.com');

			const redirectUrl = redirect.mock.calls[0]!.arguments[0] as unknown as string;
			assert.strictEqual(redirectUrl, '/manage-prompts');
		});

		it('should re-render with errors when validation fails (e.g., missing display name)', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { render } as unknown as Response;
			const mockReq = {
				body: { ...validBody, displayName: '' },
				session: mockSession
			} as unknown as Request;

			const service = setupService();
			const handler = buildAddPromptPost(service);
			await handler(mockReq, mockRes);

			const model = render.mock.calls[0]!.arguments[1] as unknown as AddPromptViewModel;

			assert.ok(model.errorSummary && model.errorSummary.length > 0);
			assert.strictEqual(model.form?.displayName || '', '');
			assert.strictEqual(model.isEdit, false);
		});
	});
});
