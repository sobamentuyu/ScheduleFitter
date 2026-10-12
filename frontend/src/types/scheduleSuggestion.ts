export type ScheduleEventStatus = 'ready' | 'needs_clarification';

export type ScheduleSuggestionEvent = {
	title: string;
	description: string | null;
	location: string | null;
	category: string | null;
	start_at: string | null;
	end_at: string | null;
	all_day: boolean;
	missing_fields: string[];
	status: ScheduleEventStatus;
	conflicts:
		| {
				id: number;
				title: string;
				start_at: string;
				end_at: string;
				all_day: boolean;
		  }[]
		| null;
};

export type ScheduleSuggestion = {
	events: ScheduleSuggestionEvent[];
};
