import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/service-name-lib/util/async-handler.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';
import { buildPostHome, buildViewHome } from './controller.ts';
import { uploadMiddleware } from '../../comments/upload-middleware.ts';

export function createHomeRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const viewHome = buildViewHome(service);
	const postHome = buildPostHome(service);
	router.get('/', asyncHandler(viewHome));
	router.post('/', uploadMiddleware, asyncHandler(postHome));
	return router;
}
