import type { JourneyResponse, Question } from '@planning-inspectorate/dynamic-forms';
import { Journey, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const PROMPT_JOURNEY_ID = 'prompt';
export const VIEW_PROMPT_JOURNEY_ID = 'prompt-view';

interface PromptJourneyOptions {
	journeyId: string;
	taskListUrl: string;
	taskListTemplate: string;
	journeyTitle: string;
	returnToListing: boolean;
	initialBackLink: string;
}

export function createPromptJourney(
	req: Request,
	response: JourneyResponse,
	questions: Record<string, Question>,
	options: PromptJourneyOptions
) {
	const promptQuestionsSection = new Section('Questions', 'questions');
	promptQuestionsSection
		.addQuestion(questions.displayName as any)
		.addQuestion(questions.category as any)
		.addQuestion(questions.content as any);

	if (questions.changeNote) {
		promptQuestionsSection.addQuestion(questions.changeNote as any);
	}

	return new Journey({
		journeyId: options.journeyId,
		sections: [promptQuestionsSection],
		taskListUrl: options.taskListUrl,
		journeyTemplate: 'views/layouts/journey.njk',
		taskListTemplate: options.taskListTemplate,
		journeyTitle: options.journeyTitle,
		returnToListing: options.returnToListing,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: options.initialBackLink,
		response
	});
}

export function createAddJourney(req: Request, response: JourneyResponse, questions: Record<string, Question>) {
	return createPromptJourney(req, response, questions, {
		journeyId: PROMPT_JOURNEY_ID,
		taskListUrl: 'check-your-answer',
		taskListTemplate: 'views/layouts/check-your-answers.njk',
		journeyTitle: 'Create a Prompt',
		returnToListing: true,
		initialBackLink: '/manage-prompts'
	});
}

export function createViewJourney(req: Request, response: JourneyResponse, questions: Record<string, Question>) {
	return createPromptJourney(req, response, questions, {
		journeyId: VIEW_PROMPT_JOURNEY_ID,
		taskListUrl: '',
		taskListTemplate: 'views/layouts/prompt-details.njk',
		journeyTitle: 'Prompt View',
		returnToListing: false,
		initialBackLink: '/'
	});
}
