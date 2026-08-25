import type { CalendarEvent } from '@/types/event.ts';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

async function request<T>(path: string): Promise<T> {
	const { user } = useAuth();
	const res = await fetch(`${API_BASE}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			/**'X-User-Id': getUserId(),**/
		},
	});

	if (!res.ok) {
		let message = `Request failed (${res.status})`;
		try {
			const body = (await res.json()) as { error?: string };
			if (body.error) message = body.error;
		} catch {
			// ignore JSON parse errors
		}
		throw new Error(message);
	}

	return (await res.json()) as T;
}

export function fetchEvents(from?: string, to?: string): Promise<CalendarEvent[]> {
	const params = new URLSearchParams();
	if (from) params.set('from', from);
	if (to) params.set('to', to);
	const query = params.toString();
	return request(`/api/events${query ? `?${query}` : ''}`);
}
