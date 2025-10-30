import { apiFetch } from "./config";

export async function listDevices() {
  return apiFetch("/devices", { method: "GET" });
}

export async function registerDevice({ device_id, name }) {
  return apiFetch("/devices", {
    method: "POST",
    body: JSON.stringify({ device_id, name }),
  });
}


