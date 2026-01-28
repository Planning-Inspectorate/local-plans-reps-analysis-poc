export interface AddPromptFormInput {
	displayName?: string;
	category?: string;
	content?: string;
	changeNote?: string;
}

export interface AddPromptValidationResult {
	form: AddPromptFormInput;
	fieldErrors?: Partial<AddPromptFormInput>;
	errorSummary?: ErrorSummaryItem[];
	isValid: boolean;
}

export interface ErrorSummaryItem {
	text: string;
	href: string;
}
