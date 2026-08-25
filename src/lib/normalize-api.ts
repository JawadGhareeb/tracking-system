import { IOrder, IOrderMaterial, IRawMaterial, IRole, IUser, OrderStatus } from "@/types";
import i18n from "@/lib/i18n";

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "CUTTING", "SEWING", "PRINTING", "PACKAGING", "STORAGE", "DELIVERY"];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
function toStringValue(value: unknown, fallback = ""): string { return typeof value === "string" ? value : fallback; }
function toNumberValue(value: unknown, fallback = 0): number { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function toBooleanValue(value: unknown, fallback = false): boolean { return typeof value === "boolean" ? value : fallback; }
function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => (typeof item === "string" ? item : "")).filter(Boolean) : [];
}

export function normalizeRole(value: unknown, fallbackId = ""): IRole {
  const role = asRecord(value);
  return { _id: toStringValue(role._id, fallbackId), name: toStringValue(role.name, i18n.t("common.unspecified")), description: toStringValue(role.description, ""), createdAt: toStringValue(role.createdAt, "") };
}

function normalizeFullName(value: unknown) {
  const fullName = asRecord(value);
  return { firstName: toStringValue(fullName.firstName, ""), lastName: toStringValue(fullName.lastName, "") };
}

export function normalizeUser(value: unknown, fallbackId = ""): IUser {
  const user = asRecord(value);
  return {
    _id: toStringValue(user._id, fallbackId), fullName: normalizeFullName(user.fullName), email: toStringValue(user.email, ""), username: toStringValue(user.username, ""),
    role: normalizeRole(user.role), salary: toNumberValue(user.salary, 0), isActive: toBooleanValue(user.isActive, false), isDeleted: toBooleanValue(user.isDeleted, false), createdAt: toStringValue(user.createdAt, ""),
  };
}

export function getUserDisplayName(user: unknown): string {
  const normalized = normalizeUser(user);
  return `${normalized.fullName.firstName} ${normalized.fullName.lastName}`.trim() || normalized.username || normalized.email || i18n.t("common.user");
}

export function normalizeRawMaterial(value: unknown, fallbackId = ""): IRawMaterial {
  const item = asRecord(value);
  const stockQuantity = toNumberValue(item.stockQuantity, 0);
  const reservedQuantity = toNumberValue(item.reservedQuantity, 0);
  return {
    _id: toStringValue(item._id, fallbackId),
    name: toStringValue(item.name, ""),
    category: (["FABRIC", "THREAD", "ACCESSORY", "OTHER"].includes(String(item.category)) ? item.category : "OTHER") as IRawMaterial["category"],
    color: toStringValue(item.color, ""),
    unit: (["PIECE", "METER", "KILOGRAM", "ROLL", "UNIT"].includes(String(item.unit)) ? item.unit : "UNIT") as IRawMaterial["unit"],
    stockQuantity,
    reservedQuantity,
    availableQuantity: toNumberValue(item.availableQuantity, Math.max(0, stockQuantity - reservedQuantity)),
    unitPrice: toNumberValue(item.unitPrice, 0),
    minimumStock: toNumberValue(item.minimumStock, 0),
    isActive: toBooleanValue(item.isActive, false),
    createdAt: toStringValue(item.createdAt, ""),
  };
}

function normalizeOrderStatus(value: unknown): OrderStatus {
  if (value === "COMPLETED" || value === "DELIVERED") return "DELIVERY";
  if (value === "IN_PROGRESS") return "CUTTING";
  if (typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus)) return value as OrderStatus;
  return "PENDING";
}

function normalizeOrderMaterials(value: unknown): IOrderMaterial[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw, index) => {
    const line = asRecord(raw);
    return {
      rawMaterial: normalizeRawMaterial(line.rawMaterial, `material-${index}`),
      nameSnapshot: toStringValue(line.nameSnapshot, ""),
      colorSnapshot: toStringValue(line.colorSnapshot, ""),
      quantity: toNumberValue(line.quantity, 0),
      unitPriceSnapshot: toNumberValue(line.unitPriceSnapshot, 0),
      subtotal: toNumberValue(line.subtotal, 0),
    };
  });
}

export function normalizeOrder(value: unknown, fallbackId = ""): IOrder {
  const order = asRecord(value);
  const deliveryLocation = asRecord(order.deliveryLocation);
  const rawMaterials = normalizeOrderMaterials(order.rawMaterials);
  const legacyCost = toNumberValue(order.cost, 0);
  const materialCost = toNumberValue(order.materialCost, rawMaterials.reduce((sum, line) => sum + line.subtotal, 0));
  const additionalCost = toNumberValue(order.additionalCost, 0);
  return {
    _id: toStringValue(order._id, fallbackId),
    customer: normalizeUser(order.customer),
    description: toStringValue(order.description, ""),
    notes: toStringValue(order.notes, ""),
    rawMaterials,
    status: normalizeOrderStatus(order.status),
    expectedFinishDate: toStringValue(order.expectedFinishDate, "") || undefined,
    materialCost,
    additionalCost,
    totalPrice: toNumberValue(order.totalPrice, legacyCost || materialCost + additionalCost),
    cost: legacyCost,
    employee: order.employee ? normalizeUser(order.employee) : undefined,
    sizes: normalizeStringArray(order.sizes),
    colors: normalizeStringArray(order.colors),
    deliveryLocation: { address: toStringValue(deliveryLocation.address, ""), city: toStringValue(deliveryLocation.city, ""), notes: toStringValue(deliveryLocation.notes, "") },
    isCancelled: toBooleanValue(order.isCancelled, false),
    cancelReason: toStringValue(order.cancelReason, ""),
    deliveredAt: toStringValue(order.deliveredAt, ""),
    createdAt: toStringValue(order.createdAt, ""),
  };
}
