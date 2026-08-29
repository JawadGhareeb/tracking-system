import { z } from "zod";

const objectIdPattern = /^[a-f\d]{24}$/i;

type Translator = (key: string, options?: { defaultValue?: string }) => string;

export function createEmployeeFormSchema(t: Translator) {
  return z.object({
    firstName: z.string().trim().min(1, t("authPages.validation.firstNameRequired")),
    lastName: z.string().trim().min(1, t("authPages.validation.lastNameRequired")),
    email: z
      .string()
      .trim()
      .min(2, t("authPages.validation.emailRequired"))
      .max(100, t("authPages.validation.emailMax")),
    phoneNumber: z.string().trim().regex(/^\+?\d{7,15}$/, t("authPages.validation.phoneInvalid", { defaultValue: "Invalid phone number" })),
    username: z.string().trim().min(1, t("authPages.validation.usernameRequired")),
    password: z.string().trim().min(8, t("authPages.validation.passwordMin")),
    salary: z
      .string()
      .trim()
      .optional()
      .refine((value) => value === undefined || value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0), t("employeeSchema.invalidSalary")),
    isActive: z.enum(["true", "false"]),
    role: z
      .string()
      .trim()
      .min(1, t("employeeForm.fields.role"))
      .regex(objectIdPattern, t("employeeSchema.invalidRoleId")),
  });
}

export function createEditEmployeeFormSchema(t: Translator) {
  const optionalEmailSchema = z
    .string()
    .trim()
    .max(100, t("authPages.validation.emailMax"))
    .optional()
    .refine(
      (value) => value === undefined || value === "" || value.length >= 2,
      t("authPages.validation.emailMin")
    );

  const optionalPasswordSchema = z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => value === undefined || value === "" || value.length >= 8,
      t("authPages.validation.passwordMin")
    );

  const optionalRoleSchema = z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => value === undefined || value === "" || objectIdPattern.test(value),
      t("employeeSchema.invalidRoleId")
    );

  const optionalSalarySchema = z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (value === undefined || value === "") {
        return true;
      }

      const numberValue = Number(value);
      return !Number.isNaN(numberValue) && numberValue >= 0;
    }, t("employeeSchema.invalidSalary"));

  return z.object({
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    email: optionalEmailSchema,
    phoneNumber: z.string().trim().optional().refine((value) => value === undefined || value === "" || /^\+?\d{7,15}$/.test(value), t("authPages.validation.phoneInvalid", { defaultValue: "Invalid phone number" })),
    username: z.string().trim().optional(),
    password: optionalPasswordSchema,
    role: optionalRoleSchema,
    salary: optionalSalarySchema,
    isActive: z.enum(["true", "false"]).optional(),
  });
}

export type EmployeeFormValues = z.infer<ReturnType<typeof createEmployeeFormSchema>>;
export type EditEmployeeFormValues = z.infer<ReturnType<typeof createEditEmployeeFormSchema>>;
