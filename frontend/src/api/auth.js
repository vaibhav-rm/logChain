import { apiFetch, setAuthToken } from "./config";

export async function signup({ email, password }) {
  const result = await apiFetch("/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (result?.access_token) setAuthToken(result.access_token);
  return result;
}

export async function login({ email, password }) {
  // FastAPI OAuth2PasswordRequestForm expects application/x-www-form-urlencoded with username and password
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  const data = await apiFetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (data?.access_token) setAuthToken(data.access_token);
  return data;
}

export function logout() {
  setAuthToken("");
}


