import type { Handler } from 'express';

/**
 * Add configuration values to locals.
 */
export function addLocalsConfiguration(): Handler {
	return (req, res, next) => {
		res.locals.config = {
			styleFile: 'style-dda45dae.css',
			headerTitle: 'Local Plans Representations Analysis – POC'
		};
		next();
	};
}
