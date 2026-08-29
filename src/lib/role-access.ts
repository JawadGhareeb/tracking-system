const ADMIN_ROLE_TOKENS = ["admin", "superadmin", "أدمن"];
const EMPLOYEE_ROLE_TOKENS = ["employee", "worker", "موظف", "عامل"];

export function normalizeRoleName(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function isAdminRoleName(value?: string | null, group?: string | null) {
  if (String(group || "").toUpperCase() === "ADMIN") return true;
  const normalized = normalizeRoleName(value);
  return ADMIN_ROLE_TOKENS.some((token) => normalized.includes(token));
}

export function isEmployeeRoleName(value?: string | null, group?: string | null) {
  if (String(group || "").toUpperCase() === "EMPLOYEE") return true;
  const normalized = normalizeRoleName(value);
  return EMPLOYEE_ROLE_TOKENS.some((token) => normalized.includes(token));
}
