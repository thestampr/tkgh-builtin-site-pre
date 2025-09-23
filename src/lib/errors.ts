export type AppError = {
  message: string;
  status?: number;
};

export function toError(e: unknown, fallback: string = 'Error'): AppError {
  if (e instanceof Response) {
    return { message: e.statusText || fallback, status: e.status };
  }
  if (e instanceof Error) {
    return { message: e.message };
  }
  if (typeof e === 'string') {
    return { message: e };
  }
  return { message: fallback };
}

export function errorJson(e: unknown, fallback: string = 'Error') {
  const { message, status } = toError(e, fallback);
  const code = typeof status === 'number' ? status : 500;
  return { body: { error: message }, status: code } as const;
}