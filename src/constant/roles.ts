export const ROLES = [
  { id: "69b482e722c218607935be6a", name: "موظف" },
  { id: "69b482d822c218607935be67", name: "مستخدم" },
  { id: "69b482bb22c218607935be64", name: "أدمن" },
] as const;

export const ROLE_IDS = {
  EMPLOYEE: ROLES[0].id,
  USER: ROLES[1].id,
  ADMIN: ROLES[2].id,
} as const;
