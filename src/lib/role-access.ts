const ADMIN_ROLE_NAMES = new Set(["admin", "superadmin", "أدمن"]);
const EMPLOYEE_ROLE_NAMES = new Set(["employee", "worker", "موظف", "عامل"]);

export function normalizeRoleName(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function isAdminRoleName(value?: string | null) {
  return ADMIN_ROLE_NAMES.has(normalizeRoleName(value));
}

export function isEmployeeRoleName(value?: string | null) {
  return EMPLOYEE_ROLE_NAMES.has(normalizeRoleName(value));
}
