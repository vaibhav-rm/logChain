import { apiFetch } from "./config";

export async function listBatches() {
  return apiFetch("/batches", { method: "GET" });
}

export async function getBatch(batchId) {
  return apiFetch(`/batches/${batchId}`, { method: "GET" });
}

export async function createBatch({ batch_id, device_id, merkle_root, ipfs_cid, size }) {
  return apiFetch("/batches", {
    method: "POST",
    body: JSON.stringify({ batch_id, device_id, merkle_root, ipfs_cid, size }),
  });
}

export async function anchorBatch(batchId) {
  return apiFetch(`/batches/${batchId}/anchor`, { method: "POST" });
}

export async function verifyBatch(batchId) {
  return apiFetch(`/batches/${batchId}/verify`, { method: "GET" });
}

export async function getOnchainTotal() {
  return apiFetch("/onchain/total", { method: "GET" });
}

export async function getDashboardStats() {
  return apiFetch("/dashboard/stats", { method: "GET" });
}


