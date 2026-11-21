const tokenKey = "codex-office-token";
export const getToken = () => localStorage.getItem(tokenKey) ?? "";
export const setToken = (token: string) =>
  localStorage.setItem(tokenKey, token);
export function consumeTokenFromHash(): string {
  const token = new URLSearchParams(location.hash.slice(1)).get("token") ?? "";
  if (token) {
    setToken(token);
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  }
  return token;
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${getToken()}`);
  if (init?.body !== undefined && !headers.has("content-type"))
    headers.set("content-type", "application/json");
  const response = await fetch(path, {
    ...init,
    headers,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.error;
    throw new Error(
      typeof detail === "string"
        ? detail
        : detail
          ? JSON.stringify(detail)
          : `Request failed: ${response.status}`,
    );
  }
  return response.json() as Promise<T>;
}
