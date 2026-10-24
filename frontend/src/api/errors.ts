export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ErrorBody = {
  error?: string;
};

export async function readErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await res.json()) as ErrorBody;
    if (body.error) return body.error;
  } catch {
    // ignore JSON parse errors
  }
  return fallback;
}

export function messageForStatus(
  status: number,
  bodyMessage: string | undefined,
  fallbacks: { unauthorized?: string; unprocessable?: string; default: string },
): string {
  if (status === 401) {
    return fallbacks.unauthorized ?? "ログインが必要です";
  }
  if (status === 422) {
    return bodyMessage ?? fallbacks.unprocessable ?? fallbacks.default;
  }
  return bodyMessage ?? fallbacks.default;
}
