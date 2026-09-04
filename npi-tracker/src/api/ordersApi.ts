export interface Build {
  order_id: number;
  order_number: string;
  ord_status: "ACTIVE" | "DRAFT" | "UNASIGNED" | "TESTPLAN";
  progress: number;
  start_date: string | null;
}

export interface OrderRack {
  rack_id: number;
  rack_serial: string;
  rack_sku: string;
  rack_gen_name: string | null;
  rack_sequence: number;
}

// Team assignment types
export interface RoleOption {
  role_id: number;
  role_name: string;
}

export interface OrderMember {
  user_id: number;
  email: string;
  display_name: string | null;
  role_id: number;
  role_name: string;
}

export interface MemberRoleAssignment {
  email: string;
  role_name: string;
}

// Test plan types
export interface AvailableTestPlan {
  test_plan_id: number;
  test_plan_name: string;
  test_plan_description: string | null;
}

// Order detail view types (Description / BOM / Test Plan / Build Log tabs)

export interface OrderOverview {
  order_id: number;
  order_number: string;
  stage: string;
  ord_status: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  crd_version_id: number | null;
  crd_revision: string | null;
  crd_id: number | null;
  crd_number: string | null;
  crd_name: string | null;
}

export interface RackDevice {
  device_id: number;
  serial_number: string | null;
  part_number: string | null;
  position: number;
  device_description: string | null;
}

export interface DeviceComponent {
  component_id: number;
  serial_number: string | null;
  part_number: string | null;
  component_role: string | null;
  component_name: string | null;
}

export interface TestPlanCase {
  test_case_id: number;
  test_name: string;
  test_description: string | null;
  test_level: string;
  duration_minutes: number | null;
  sequence: number | null;
}

export interface OrderTestPlanOverview {
  test_plan: { test_plan_id: number; test_plan_name: string; test_plan_description: string | null } | null;
  test_cases: TestPlanCase[];
  duration_by_level: Record<string, number>;
}

export interface OrderLogEntry {
  event_date: string;
  event_type: string;
  log_text: string;
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

// Functions for the team role assignment

export async function getAssignableRoles(orderId: number): Promise<RoleOption[]> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/team/roles`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load assignable roles");
  return res.json();
}

export async function getOrderTeam(orderId: number): Promise<OrderMember[]> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/team`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load order team");
  return res.json();
}

export async function assignTeamRoles(
  orderId: number,
  members: MemberRoleAssignment[]
): Promise<{ order_id: number; ord_status: string }> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ members }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ? String(body.detail) : "Failed to assign roles");
  }
  return res.json();
}

// Functions for the test plan step

export async function getAvailableTestPlans(orderId: number): Promise<AvailableTestPlan[]> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/activation/available-test-plans`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load available test plans");
  return res.json();
}

export async function createTestPlan(
  test_plan_name: string,
  test_plan_description: string | null
): Promise<{ test_plan_id: number }> {
  const res = await fetch(`${BASE_URL}/test-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ test_plan_name, test_plan_description }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ? JSON.stringify(body.detail) : "Failed to create test plan");
  }
  return res.json();
}

export const uploadTestPlanCases = (testPlanId: number, file: File) =>
  uploadFile(`${BASE_URL}/test-plans/${testPlanId}/cases`, file);

// Order detail view calls

export async function getOrderOverview(orderId: number): Promise<OrderOverview> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load order details");
  return res.json();
}

export async function getRackDevices(orderId: number, rackId: number): Promise<RackDevice[]> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/bom/racks/${rackId}/devices`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load rack devices");
  return res.json();
}

export async function getDeviceComponents(orderId: number, deviceId: number): Promise<DeviceComponent[]> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/bom/devices/${deviceId}/components`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load device components");
  return res.json();
}

export async function getOrderTestPlan(orderId: number): Promise<OrderTestPlanOverview> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/test-plan`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load test plan");
  return res.json();
}

export async function getOrderLog(orderId: number): Promise<OrderLogEntry[]> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/log`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load build log");
  return res.json();
}

// Adds/re-roles team members on an order without touching ord_status --
// used from the order detail screen's Team Roster tab. Distinct from
// assignTeamRoles(), which is the UNASIGNED -> TESTPLAN workflow step.
export async function addTeamMembers(
  orderId: number,
  members: MemberRoleAssignment[]
): Promise<{ order_id: number }> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/team/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ members }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ? String(body.detail) : "Failed to add team members");
  }
  return res.json();
}

export async function assignTestPlan(testPlanId: number, orderId: number) {
  const res = await fetch(`${BASE_URL}/test-plans/${testPlanId}/assign/${orderId}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ? JSON.stringify(body.detail) : "Failed to assign test plan");
  }
  return res.json();
}