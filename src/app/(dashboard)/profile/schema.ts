import { z } from "zod";

type Translator = (key: string) => string;

export function createProfileFormSchema(t: Translator) {
  return z.object({
    firstName: z.string().trim().min(1, t("authPages.validation.firstNameRequired")),
    lastName: z.string().trim().min(1, t("authPages.validation.lastNameRequired")),
    email: z
      .string()
      .trim()
      .min(2, t("authPages.validation.emailRequired"))
      .max(100, t("authPages.validation.emailMax")),
    username: z.string().trim().min(1, t("authPages.validation.usernameRequired")),
    password: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => value === undefined || value === "" || value.length >= 8,
        t("authPages.validation.passwordMin")
      ),
  });
}

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileFormSchema>>;
