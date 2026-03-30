import type { Request } from 'express';
import {
	addSessionData,
	readSessionData,
	clearSessionData
} from '@pins/local-plans-reps-analysis-poc-lib/util/session.ts';

const SESSION_FIELD = 'persistence';
const SESSION_ID = 'lastRequest';
const STATUS_KEY = 'status';

/**
 * Store a prompt status in the session.
 */
export function setPromptStatusInSession(req: Request, status: string): void {
	addSessionData(req, SESSION_ID, { [STATUS_KEY]: status }, SESSION_FIELD);
}

/**
 * Read the prompt status from the session.
 */
export function readPromptStatusFromSession(req: Request): string {
	return readSessionData(req, SESSION_ID, STATUS_KEY, '', SESSION_FIELD) as string;
}

/**
 * Clear the prompt status from the session.
 */
export function clearPromptStatusFromSession(req: Request): void {
	clearSessionData(req, SESSION_ID, [STATUS_KEY], SESSION_FIELD);
}
