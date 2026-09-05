import type { ScheduleSuggestion } from '@/types/scheduleSuggestion.ts';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export async function createScheduleSuggestion(request: string): Promise<ScheduleSuggestion> {
	const res = await fetch(`${API_BASE}/api/schedule-suggestions`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ request }),
	});

	const body = (await res.json().catch(() => null)) as {
		suggestion?: ScheduleSuggestion;
		error?: string;
	} | null;

	if (!res.ok) {
		if (res.status === 401) {
			throw new Error('ログインが必要です');
		}
		if (res.status === 422) {
			throw new Error(body?.error ?? '入力内容を確認してください');
		}
		throw new Error('予定を読み取れませんでした。もう一度送ってみてください。');
	}

	if (!body?.suggestion) {
		throw new Error('予定を読み取れませんでした。もう一度送ってみてください。');
	}

	return body.suggestion;
}
