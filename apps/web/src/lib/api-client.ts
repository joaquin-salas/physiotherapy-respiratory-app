/**
 * The only place in the web app that calls fetch().
 * URLs are relative ("/api/..."): Vite (dev) or nginx (prod) forwards them to the API.
 */

/** Error returned by the API (NestJS error format). */
export class ApiError extends Error {
  readonly status: number;
  /** NestJS validation errors come as a list of messages, other errors as one message */
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join(', '));
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  // Body may be empty (e.g. 204 No Content)
  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message = (body as { message?: string | string[] } | undefined)
      ?.message;
    const messages = Array.isArray(message)
      ? message
      : [message ?? `Request failed with status ${response.status}`];
    throw new ApiError(response.status, messages);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
