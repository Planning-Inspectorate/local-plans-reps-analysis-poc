import { BaseService } from '@pins/local-plans-reps-analysis-poc-lib/app/base-service.ts';
import type { Config } from './config.ts';
import { PromptsClient } from '@pins/local-plans-reps-analysis-poc-lib/data/database/prompts-client.ts';

/**
 * This class encapsulates all the services and clients for the application
 */
export class ManageService extends BaseService {
	/**
	 * @private
	 */
	#config: Config;
	promptClient;

	constructor(config: Config) {
		super(config);
		this.#config = config;
		this.promptClient = new PromptsClient(this.dbClient);
	}

	get authConfig(): Config['auth'] {
		return this.#config.auth;
	}

	get authDisabled(): boolean {
		return this.#config.auth.disabled;
	}
}
