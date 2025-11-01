import { apiFetch } from "./config";

export async function listDevices(includeBatchInfo = false) {
  const params = includeBatchInfo ? "?include_batch_info=true" : ""
  return apiFetch(`/devices${params}`, { method: "GET" });
}

export async function registerDevice({ device_id, name }) {
  return apiFetch("/devices", {
    method: "POST",
    body: JSON.stringify({ device_id, name }),
  });
}

export async function deleteDevice(device_id) {
  return apiFetch(`/devices/${device_id}`, { method: "DELETE" });
}

