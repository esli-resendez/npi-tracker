export interface Build {
  order_id: number;
  order_number: string;
  ord_status: "ACTIVE" | "DRAFT";
  progress: number;
  start_date: string | null;
}

export interface OrderRack {
  rack_id: number;
  rack_serial: string;
  rack_sku: string;
  rack_sequence: number;
}

// Matches the convention already used in main_pages/create_new.tsx --
// calls the backend directly rather than relying on a Vite dev-server proxy
// (none is configured in vite.config.ts).
const BASE_URL = "http://localhost:8000/api";

// TEMPORARY: there's no real auth yet, so /api/builds is called with a
// hardcoded username instead of a logged-in identity. Swap this for whatever
// your auth solution ends up being (session, JWT, SSO) -- search this
// constant name when that lands.
export const CURRENT_USERNAME = "eslir@microsoft.com";

export async function getBuilds(username: string = CURRENT_USERNAME): Promise<Build[]> {
  const res = await fetch(`${BASE_URL}/builds?username=${encodeURIComponent(username)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to load builds (${res.status}): ${body}`);
  }
  return res.json();
}

export async function getOrderRacks(orderId: number): Promise<OrderRack[]> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/activation/racks`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load racks for order");
  return res.json();
}

async function uploadFile(url: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(url, { method: "POST", body: formData, credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ? JSON.stringify(body.detail) : "Upload failed");
  }
  return res.json();
}

export const uploadRackBom = (orderId: number, file: File) =>
  uploadFile(`${BASE_URL}/orders/${orderId}/activation/rack-bom`, file);
export const uploadBuildingBlockBom = (orderId: number, file: File) =>
  uploadFile(`${BASE_URL}/orders/${orderId}/activation/building-block-bom`, file);
export const uploadRackSerials = (orderId: number, file: File) =>
  uploadFile(`${BASE_URL}/orders/${orderId}/activation/rack-serials`, file);
export const uploadComponentSerials = (orderId: number, file: File) =>
  uploadFile(`${BASE_URL}/orders/${orderId}/activation/component-serials`, file);

export async function startOrder(orderId: number, startDate: string) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/activation/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ start_date: startDate }),
  });
  if (!res.ok) throw new Error("Failed to activate order");
  return res.json();
}