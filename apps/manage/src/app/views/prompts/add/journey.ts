import type { JourneyResponse, Question } from '@planning-inspectorate/dynamic-forms';
import { Journey, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const PROMPT_JOURNEY_ID = 'prompt';

export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, Question>) {
	const promptQuestionsSection = new Section('Questions', 'questions');
	promptQuestionsSection
		.addQuestion(questions.displayName as any)
		.addQuestion(questions.category as any)
		.addQuestion(questions.content as any);

	if (questions.changeNote) {
		promptQuestionsSection.addQuestion(questions.changeNote as any);
	}

	return new Journey({
		journeyId: PROMPT_JOURNEY_ID,
		sections: [promptQuestionsSection],
		taskListUrl: 'check-your-answer',
		journeyTemplate: 'views/layouts/journey.njk',
		taskListTemplate: 'views/layouts/check-your-answers.njk',
		journeyTitle: 'Create a Prompt',
		returnToListing: true,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: '/manage-prompts',
		response
	});
}
