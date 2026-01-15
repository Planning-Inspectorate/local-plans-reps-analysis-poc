import type { CommentsData } from '../../comments/interface.ts';

export interface HomeView {
	commentsData?: CommentsData | null;
	errorMessage?: ErrorMessage | null;
}

export interface ErrorMessage {
	text: string;
}
