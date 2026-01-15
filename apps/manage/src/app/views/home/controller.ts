import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/service-name-lib/util/async-handler.ts';

export function buildHome(service: ManageService): AsyncRequestHandler {
	const { db, logger } = service;
	return async (req, res) => {
		logger.info('home page');

		// check the DB connection is working
		await db.$queryRaw`SELECT 1`;

		return res.render('views/home/view.njk', {});
	};
}
