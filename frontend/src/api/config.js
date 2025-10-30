// Frontend API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function getAuthToken() {
  return localStorage.getItem("auth_token") || "";
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.detail || data?.message || "Request failed";
    throw new Error(message);
  }
  return data;
}


