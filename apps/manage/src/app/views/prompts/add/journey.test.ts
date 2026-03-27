import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	createPromptJourney,
	createAddJourney,
	createViewJourney,
	PROMPT_JOURNEY_ID,
	VIEW_PROMPT_JOURNEY_ID
} from './journey.ts';
import { Journey, Section } from '@planning-inspectorate/dynamic-forms';
import type { JourneyResponse, Question } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

describe('journey', () => {
	const createMockReq = (overrides: Record<string, any> = {}) =>
		({
			baseUrl: '/test-base',
			...overrides
		}) as unknown as Request;

	const createMockResponse = (overrides: Record<string, any> = {}) =>
		({
			journeyId: 'test',
			referenceId: 'ref',
			answers: {},
			...overrides
		}) as unknown as JourneyResponse;

	const createMockQuestion = (fieldName: string) => ({ fieldName }) as unknown as Question;

	const createBaseQuestions = () => ({
		displayName: createMockQuestion('displayName'),
		category: createMockQuestion('category'),
		content: createMockQuestion('content')
	});

	const defaultOptions = {
		journeyId: 'test-journey',
		taskListUrl: 'task-list',
		taskListTemplate: 'views/layouts/task-list.njk',
		journeyTitle: 'Test Journey',
		returnToListing: true,
		initialBackLink: '/back'
	};

	describe('createPromptJourney', () => {
		it('should return a Journey instance', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.ok(journey instanceof Journey);
		});

		it('should set journeyId from options', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.journeyId, 'test-journey');
		});

		it('should set journeyTitle from options', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.journeyTitle, 'Test Journey');
		});

		it('should set taskListUrl from options', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.taskListUrl, '/test-base/task-list');
		});

		it('should always use the standard journey template', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.journeyTemplate, 'views/layouts/journey.njk');
		});

		it('should set taskListTemplate from options', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.taskListTemplate, 'views/layouts/task-list.njk');
		});

		it('should set returnToListing from options', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), {
				...defaultOptions,
				returnToListing: false
			});

			assert.strictEqual(journey.returnToListing, false);
		});

		it('should set initialBackLink from options', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.initialBackLink, '/back');
		});

		it('should derive baseUrl from the request', () => {
			const journey = createPromptJourney(
				createMockReq({ baseUrl: '/my-base' }),
				createMockResponse(),
				createBaseQuestions(),
				defaultOptions
			);

			assert.strictEqual(journey.baseUrl, '/my-base');
		});

		it('should attach the response to the journey', () => {
			const response = createMockResponse();
			const journey = createPromptJourney(createMockReq(), response, createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.response, response);
		});

		it('should create a single "Questions" section', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.sections.length, 1);
			assert.ok(journey.sections[0] instanceof Section);
			assert.strictEqual(journey.sections[0].name, 'Questions');
			assert.strictEqual(journey.sections[0].segment, 'questions');
		});

		it('should add displayName, category and content questions', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.sections[0].questions.length, 3);
		});

		it('should include changeNote question when provided', () => {
			const questions = {
				...createBaseQuestions(),
				changeNote: createMockQuestion('changeNote')
			};
			const journey = createPromptJourney(createMockReq(), createMockResponse(), questions, defaultOptions);

			assert.strictEqual(journey.sections[0].questions.length, 4);
		});

		it('should omit changeNote question when not provided', () => {
			const journey = createPromptJourney(createMockReq(), createMockResponse(), createBaseQuestions(), defaultOptions);

			assert.strictEqual(journey.sections[0].questions.length, 3);
		});
	});

	describe('createAddJourney', () => {
		it('should use the PROMPT_JOURNEY_ID', () => {
			const journey = createAddJourney(createMockReq(), createMockResponse(), createBaseQuestions());

			assert.strictEqual(journey.journeyId, PROMPT_JOURNEY_ID);
		});

		it('should configure the add-specific options', () => {
			const journey = createAddJourney(createMockReq(), createMockResponse(), createBaseQuestions());

			assert.strictEqual(journey.taskListUrl, '/test-base/check-your-answer');
			assert.strictEqual(journey.taskListTemplate, 'views/layouts/check-your-answers.njk');
			assert.strictEqual(journey.journeyTitle, 'Create a Prompt');
			assert.strictEqual(journey.returnToListing, true);
			assert.strictEqual(journey.initialBackLink, '/manage-prompts');
		});
	});

	describe('createViewJourney', () => {
		it('should use the VIEW_PROMPT_JOURNEY_ID', () => {
			const journey = createViewJourney(createMockReq(), createMockResponse(), createBaseQuestions());

			assert.strictEqual(journey.journeyId, VIEW_PROMPT_JOURNEY_ID);
		});

		it('should configure the view-specific options', () => {
			const journey = createViewJourney(createMockReq(), createMockResponse(), createBaseQuestions());

			assert.strictEqual(journey.taskListUrl, '/test-base');
			assert.strictEqual(journey.taskListTemplate, 'views/layouts/prompt-details.njk');
			assert.strictEqual(journey.journeyTitle, 'Prompt View');
			assert.strictEqual(journey.returnToListing, false);
			assert.strictEqual(journey.initialBackLink, '/');
		});
	});

	describe('exported constants', () => {
		it('should export PROMPT_JOURNEY_ID as "prompt"', () => {
			assert.strictEqual(PROMPT_JOURNEY_ID, 'prompt');
		});

		it('should export VIEW_PROMPT_JOURNEY_ID as "prompt-view"', () => {
			assert.strictEqual(VIEW_PROMPT_JOURNEY_ID, 'prompt-view');
		});
	});
});
