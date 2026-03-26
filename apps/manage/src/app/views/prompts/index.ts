import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-reps-analysis-poc-lib/util/async-handler.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';
import { buildViewPrompts } from './list/controller.ts';
import { buildDeletePromptPost, buildDeletePromptView } from './delete/controller.ts';
import { buildPromptVersionView } from './version/controller.ts';
import { createAddPromptsRoutes } from './add/index.ts';
import { createViewPromptsRoutes } from './view/index.ts';
import { managePromptMiddleware } from './view/controller.ts';

export function createPromptsRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

	router.use(managePromptMiddleware);

	// Read
	const promptsView = buildViewPrompts(service);
	const promptVersionView = buildPromptVersionView(service);

	// Delete
	const deletePromptView = buildDeletePromptView(service);
	const deletePromptPost = buildDeletePromptPost(service);

	// Read routes
	router.get('/', asyncHandler(promptsView));

	// Delete routes
	router.get('/:id/delete', asyncHandler(deletePromptView));
	router.post('/:id/delete', asyncHandler(deletePromptPost));

	// Prompt Version history route
	router.get('/:id/version', asyncHandler(promptVersionView));

	// View prompt routes
	router.use('/:id/edit', createViewPromptsRoutes(service));

	// Add prompt routes
	router.use('/add', createAddPromptsRoutes(service));

	return router;
}
