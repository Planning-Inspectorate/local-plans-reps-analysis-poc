export interface AddPromptViewModel {
	pageHeading: string;
	backLink?: string;
	actionPath?: string;
	categoriesItems: { value: string; text: string; selected?: boolean }[];
	form?: {
		displayName?: string;
		category?: string;
		content?: string;
		changeNote?: string;
	};
	isFormUnchanged?: boolean;
	isEdit?: boolean;
	fieldErrors?: Record<string, string> | undefined;
	errorSummary?: { text: string; href: string }[];
	success?: { id: string; message: string };
}
