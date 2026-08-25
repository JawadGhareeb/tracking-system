import { z } from "zod";

export const ORDER_STATUS = [
  "PENDING",
  "CUTTING",
  "SEWING",
  "PRINTING",
  "PACKAGING",
  "STORAGE",
  "DELIVERY",
] as const;

const objectIdPattern = /^[a-f\d]{24}$/i;
type Translator = (key: string) => string;

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export function createCreateOrderFormSchema(t: Translator) {
  const requiredCostSchema = z
    .string()
    .trim()
    .min(1, t("orderSchema.costRequired"))
    .refine((value) => {
      const numberValue = Number(value);
      return !Number.isNaN(numberValue) && numberValue >= 0;
    }, t("orderSchema.costInvalid"));

  return z.object({
    customer: z
      .string()
      .trim()
      .min(1, t("orderSchema.customerRequired"))
      .regex(objectIdPattern, t("orderSchema.customerIdInvalid")),
    employee: z
      .string()
      .trim()
      .min(1, t("orderSchema.employeeRequired"))
      .regex(objectIdPattern, t("orderSchema.employeeIdInvalid")),
    description: z
      .string()
      .trim()
      .min(3, t("orderSchema.descriptionRequired"))
      .max(500, t("orderSchema.descriptionTooLong")),
    status: z.enum(ORDER_STATUS),
    expectedFinishDate: z
      .string()
      .trim()
      .min(1, t("orderSchema.expectedDateRequired"))
      .refine(isValidDate, t("orderSchema.expectedDateInvalid")),
    cost: requiredCostSchema,
    sizes: z.string().optional(),
    colors: z.string().optional(),
    address: z.string().trim().min(1, t("orderSchema.addressRequired")),
    city: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}

export function createEditOrderFormSchema(t: Translator) {
  const optionalObjectIdSchema = z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => value === undefined || value === "" || objectIdPattern.test(value),
      t("orderSchema.idInvalid")
    );

  const optionalDescriptionSchema = z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => value === undefined || value === "" || value.length >= 3,
      t("orderSchema.descriptionMin")
    )
    .refine(
      (value) => value === undefined || value === "" || value.length <= 500,
      t("orderSchema.descriptionTooLong")
    );

  const optionalExpectedFinishDateSchema = z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => value === undefined || value === "" || isValidDate(value),
      t("orderSchema.expectedDateInvalid")
    );

  const optionalCostSchema = z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (value === undefined || value === "") {
        return true;
      }

      const numberValue = Number(value);
      return !Number.isNaN(numberValue) && numberValue >= 0;
    }, t("orderSchema.costInvalid"));

  return z.object({
    customer: optionalObjectIdSchema,
    employee: optionalObjectIdSchema,
    description: optionalDescriptionSchema,
    status: z.enum(ORDER_STATUS).optional(),
    expectedFinishDate: optionalExpectedFinishDateSchema,
    cost: optionalCostSchema,
    sizes: z.string().trim().optional(),
    colors: z.string().trim().optional(),
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}

export type CreateOrderFormValues = z.infer<ReturnType<typeof createCreateOrderFormSchema>>;
export type EditOrderFormValues = z.infer<ReturnType<typeof createEditOrderFormSchema>>;
