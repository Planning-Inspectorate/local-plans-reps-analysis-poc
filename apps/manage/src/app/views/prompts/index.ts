import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';
import { buildViewPrompts } from './list/controller.ts';
import { buildAddPromptPost, buildAddPromptView } from './add/controller.ts';
import { buildDeletePromptPost, buildDeletePromptView } from './delete/controller.ts';
import { buildPromptVersionView } from './version/controller.ts';
import { buildEditPromptPost, buildEditPromptView } from './edit/controller.ts';

export function createPromptsRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Create
	const addPromptView = buildAddPromptView(service);
	const addPromptPost = buildAddPromptPost(service);

	// Read
	const promptsview = buildViewPrompts(service);
	const promptVersionView = buildPromptVersionView(service);

	// Update
	const editPromptView = buildEditPromptView(service);
	const editPromptPost = buildEditPromptPost(service);

	// Delete
	const deletePromptView = buildDeletePromptView(service);
	const deletePromptPost = buildDeletePromptPost(service);

	// Read routes
	router.get('/', asyncHandler(promptsview));

	// Create routes
	router.get('/add', asyncHandler(addPromptView));
	router.post('/add', asyncHandler(addPromptPost));

	// Update routes
	router.get('/:id/edit', asyncHandler(editPromptView));
	router.post('/:id/edit', asyncHandler(editPromptPost));

	// Delete routes
	router.get('/:id/delete', asyncHandler(deletePromptView));
	router.post('/:id/delete', asyncHandler(deletePromptPost));

	// Version route
	router.get('/:id/version', asyncHandler(promptVersionView));

	return router;
}
