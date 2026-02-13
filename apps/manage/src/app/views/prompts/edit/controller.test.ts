import { describe, it, mock, type Mock } from 'node:test';
import assert from 'node:assert/strict';
import { mockLogger } from '@pins/local-plans-reps-analysis-poc-lib/testing/mock-logger.ts';
import { buildEditPromptView, buildEditPromptPost } from './controller.ts';
import {
	createMockPrompt,
	createMockUser
} from '@pins/local-plans-reps-analysis-poc-lib/data/database/prompts-client.test.ts';
import type { AddPromptViewModel } from '../add/interface.d.ts';
import type { PromptWithLatest } from '@pins/local-plans-reps-analysis-poc-lib/data/interface.ts';
import type { Request, Response } from 'express';
import type { ManageService } from '#service';

describe('Edit Prompt Controller', () => {
	const promptId = '722f466b-4f70-4f51-9311-8408107957e1';
	const mockCategories = ['General', 'Legal', 'Technical'];

	const setupService = (overrides = {}) =>
		({
			logger: mockLogger(),
			promptClient: {
				getPromptById: mock.fn(),
				listPromptCategories: mock.fn(async () => mockCategories),
				updatePrompt: mock.fn(),
				...overrides
			}
		}) as unknown as ManageService;

	describe('GET buildEditPromptView', () => {
		it('should fetch the prompt and categories to render the edit form', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { render } as unknown as Response;
			const mockReq = { params: { id: promptId } } as unknown as Request;

			const mockPrompt: PromptWithLatest = {
				...createMockPrompt({ id: promptId, displayName: 'Standard Research Prompt' }),
				Author: createMockUser(),
				Category: { id: 'cat-uuid', name: 'General' },
				latestVersion: {
					id: 'v-uuid',
					content: 'The original prompt content',
					createdAt: new Date(),
					promptId: promptId,
					changeNote: 'First draft',
					editorId: 'user-uuid'
				}
			};

			const service = setupService({
				getPromptById: mock.fn(async () => mockPrompt)
			});

			const handler = buildEditPromptView(service);
			await handler(mockReq, mockRes);

			const call = render.mock.calls[0]!;
			const view = call.arguments[0] as string;
			const model = call.arguments[1] as unknown as AddPromptViewModel;

			assert.strictEqual(view, 'views/prompts/add/view.njk');
			assert.strictEqual(model.pageHeading, 'Edit Prompt');
			assert.strictEqual(model.isEdit, true);
			assert.strictEqual(model.form?.displayName, 'Standard Research Prompt');
			assert.strictEqual(model.form?.content, 'The original prompt content');
		});
	});

	describe('POST buildEditPromptPost', () => {
		const validBody = {
			displayName: 'Improved Prompt',
			category: 'Legal',
			content: 'Updated legal instructions',
			changeNote: 'Updated for 2026 regulations'
		};

		const mockSession = {
			account: {
				idTokenClaims: {
					oid: '6cc77b60-c3a5-4424-913a-969c3629e469',
					name: "Sarah-Jane O'Connor",
					preferred_username: 'sj.oconnor@example.gov.uk'
				}
			}
		};

		// shared mock prompt used by POST tests
		const mockPrompt: PromptWithLatest = {
			...createMockPrompt({ id: promptId, displayName: 'Standard Research Prompt' }),
			Author: createMockUser(),
			Category: { id: 'cat-uuid', name: 'General' },
			latestVersion: {
				id: 'v-uuid',
				content: 'The original prompt content',
				createdAt: new Date(),
				promptId: promptId,
				changeNote: 'First draft',
				editorId: 'user-uuid'
			}
		};

		it('should successfully update the prompt and redirect when data is valid', async () => {
			const redirect = mock.fn() as Mock<Response['redirect']>;
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { redirect, render } as unknown as Response;
			const mockReq = {
				params: { id: promptId },
				body: validBody,
				session: { ...mockSession }
			} as unknown as Request;

			const updatePrompt = mock.fn(async () => {});
			const service = setupService({ updatePrompt, getPromptById: mock.fn(async () => mockPrompt) });

			const handler = buildEditPromptPost(service);
			await handler(mockReq, mockRes);

			// @ts-ignore
			const updateArgs = updatePrompt.mock.calls[0]!.arguments[0] as unknown as Record<string, string>;
			assert.strictEqual(updateArgs.promptId, promptId);
			assert.strictEqual(updateArgs.displayName, 'Improved Prompt');
			assert.strictEqual(updateArgs.fullName, "Sarah-Jane O'Connor");

			const redirectUrl = redirect.mock.calls[0]!.arguments[0] as unknown as string;
			assert.strictEqual(redirectUrl, '/manage-prompts');
			// verify session status is set for subsequent view using session utility structure
			// @ts-ignore
			assert.strictEqual((mockReq.session as any)?.persistence?.lastRequest?.status, 'updated');
		});

		it('should re-render the edit view with errors when validation fails', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { render } as unknown as Response;

			const mockReq = {
				params: { id: promptId },
				body: {
					displayName: '',
					category: 'General',
					content: 'Some content',
					changeNote: 'Fixing'
				},
				session: mockSession
			} as unknown as Request;

			const service = setupService({ getPromptById: mock.fn(async () => mockPrompt) });
			const handler = buildEditPromptPost(service);
			await handler(mockReq, mockRes);

			const call = render.mock.calls[0]!;
			const view = call.arguments[0] as string;
			const model = call.arguments[1] as unknown as AddPromptViewModel;

			assert.strictEqual(view, 'views/prompts/add/view.njk');
			assert.ok(model.errorSummary && model.errorSummary.length > 0, 'Should have errors');
			assert.strictEqual(model.form?.displayName || '', '', 'Display name should be empty');
			assert.strictEqual(model.isEdit, true);
		});

		it('should load 500 error page when update throws', async () => {
			const render = mock.fn() as Mock<Response['render']>;
			const mockRes = { render } as unknown as Response;
			const mockReq = {
				params: { id: promptId },
				body: validBody,
				session: mockSession
			} as unknown as Request;

			const updatePrompt = mock.fn(async () => {
				throw new Error('DB unavailable');
			});

			const service = setupService({ updatePrompt, getPromptById: mock.fn(async () => mockPrompt) });
			const handler = buildEditPromptPost(service);

			await handler(mockReq, mockRes);

			const call = render.mock.calls[0]!;
			const view = call.arguments[0] as string;
			const model = call.arguments[1] as { backLink?: string };

			assert.strictEqual(view, 'views/errors/500.njk');
			assert.strictEqual(model.backLink, '/manage-prompts');
		});
	});
});
