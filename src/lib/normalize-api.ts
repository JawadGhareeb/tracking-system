import { IOrder, IRole, IUser, OrderStatus } from "@/types";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item : ""))
    .filter((item) => item.length > 0);
}

export function normalizeRole(value: unknown, fallbackId = ""): IRole {
  const role = asRecord(value);

  return {
    _id: toStringValue(role._id, fallbackId),
    name: toStringValue(role.name, "غير محدد"),
    description: toStringValue(role.description, ""),
    createdAt: toStringValue(role.createdAt, ""),
  };
}

function normalizeFullName(value: unknown) {
  const fullName = asRecord(value);

  return {
    firstName: toStringValue(fullName.firstName, ""),
    lastName: toStringValue(fullName.lastName, ""),
  };
}

export function getUserDisplayName(user: unknown): string {
  const normalized = normalizeUser(user);
  const fullName = `${normalized.fullName.firstName} ${normalized.fullName.lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  if (normalized.username) {
    return normalized.username;
  }

  if (normalized.email) {
    return normalized.email;
  }

  return "مستخدم";
}

export function normalizeUser(value: unknown, fallbackId = ""): IUser {
  const user = asRecord(value);

  return {
    _id: toStringValue(user._id, fallbackId),
    fullName: normalizeFullName(user.fullName),
    email: toStringValue(user.email, ""),
    username: toStringValue(user.username, ""),
    role: normalizeRole(user.role),
    salary: toNumberValue(user.salary, 0),
    isActive: toBooleanValue(user.isActive, false),
    isDeleted: toBooleanValue(user.isDeleted, false),
    createdAt: toStringValue(user.createdAt, ""),
  };
}

function normalizeOrderStatus(value: unknown): OrderStatus {
  if (value === "DELIVERED") {
    return "COMPLETED";
  }

  if (typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus)) {
    return value as OrderStatus;
  }

  return "PENDING";
}

export function normalizeOrder(value: unknown, fallbackId = ""): IOrder {
  const order = asRecord(value);
  const deliveryLocation = asRecord(order.deliveryLocation);

  return {
    _id: toStringValue(order._id, fallbackId),
    customer: normalizeUser(order.customer),
    description: toStringValue(order.description, ""),
    status: normalizeOrderStatus(order.status),
    expectedFinishDate: toStringValue(order.expectedFinishDate, ""),
    cost: toNumberValue(order.cost, 0),
    employee: normalizeUser(order.employee),
    sizes: normalizeStringArray(order.sizes),
    colors: normalizeStringArray(order.colors),
    deliveryLocation: {
      address: toStringValue(deliveryLocation.address, ""),
      city: toStringValue(deliveryLocation.city, ""),
      notes: toStringValue(deliveryLocation.notes, ""),
    },
    images: normalizeStringArray(order.images),
    employeeSignature: toStringValue(order.employeeSignature, ""),
    customerSignature: toStringValue(order.customerSignature, ""),
    createdAt: toStringValue(order.createdAt, ""),
  };
}
