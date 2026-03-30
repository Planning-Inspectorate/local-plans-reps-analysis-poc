import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Request } from 'express';
import {
	setPromptStatusInSession,
	readPromptStatusFromSession,
	clearPromptStatusFromSession
} from './prompt-session.ts';

describe('prompt-session', () => {
	describe('setPromptStatusInSession', () => {
		it('should throw if no session', () => {
			const req = {} as Request;
			assert.throws(() => setPromptStatusInSession(req, 'running'));
		});
		it('should store the prompt status in the session', () => {
			const req = { session: {} } as Request;
			setPromptStatusInSession(req, 'running');
			assert.deepStrictEqual(req.session, {
				persistence: {
					lastRequest: {
						status: 'running'
					}
				}
			});
		});
		it('should overwrite an existing prompt status', () => {
			const req = { session: { persistence: { lastRequest: { status: 'running' } } } } as unknown as Request;
			setPromptStatusInSession(req, 'complete');
			assert.deepStrictEqual(req.session, {
				persistence: {
					lastRequest: {
						status: 'complete'
					}
				}
			});
		});
	});
	describe('readPromptStatusFromSession', () => {
		it('should return false if no session', () => {
			const req = {} as Request;
			const result = readPromptStatusFromSession(req);
			assert.strictEqual(result, false);
		});
		it('should return the prompt status from the session', () => {
			const req = { session: { persistence: { lastRequest: { status: 'running' } } } } as unknown as Request;
			const result = readPromptStatusFromSession(req);
			assert.strictEqual(result, 'running');
		});
		it('should return empty string if no status is set', () => {
			const req = { session: {} } as Request;
			const result = readPromptStatusFromSession(req);
			assert.strictEqual(result, '');
		});
	});
	describe('clearPromptStatusFromSession', () => {
		it('should return if no session', () => {
			const req = {} as Request;
			clearPromptStatusFromSession(req);
			assert.deepStrictEqual(req, {});
		});
		it('should clear the prompt status from the session', () => {
			const req = { session: { persistence: { lastRequest: { status: 'complete' } } } } as unknown as Request;
			clearPromptStatusFromSession(req);
			assert.deepStrictEqual(req.session, {
				persistence: {
					lastRequest: {}
				}
			});
		});
		it('should not affect other session data', () => {
			const req = {
				session: { persistence: { lastRequest: { status: 'complete', other: 'data' } } }
			} as unknown as Request;
			clearPromptStatusFromSession(req);
			assert.deepStrictEqual(req.session, {
				persistence: {
					lastRequest: {
						other: 'data'
					}
				}
			});
		});
	});
});
