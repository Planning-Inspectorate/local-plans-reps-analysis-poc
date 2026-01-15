import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/service-name-lib/util/async-handler.ts';

import type { ManageService } from '#service';
import type { IRouter } from 'express';
import { buildHome } from './controller.ts';

export function createRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const homePage = buildHome(service);

	router.get('/', asyncHandler(homePage));

	return router;
}
