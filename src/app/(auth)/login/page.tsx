"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hook/use-auth";
import { isAdminRoleName, isEmployeeRoleName } from "@/lib/role-access";

interface ILoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ILoginErrors>({});

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: ILoginErrors = {};
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail) {
      nextErrors.email = t("authPages.validation.emailRequired");
    } else if (normalizedEmail.length < 2) {
      nextErrors.email = t("authPages.validation.emailMin");
    } else if (normalizedEmail.length > 100) {
      nextErrors.email = t("authPages.validation.emailMax");
    }

    if (!normalizedPassword) {
      nextErrors.password = t("authPages.validation.passwordRequired");
    } else if (normalizedPassword.length < 8) {
      nextErrors.password = t("authPages.validation.passwordMin");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const response = await login({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (!response.success) {
      setErrors({
        general: response.error ?? t("authPages.login.invalidCredentials"),
      });
      return;
    }

    const roleName = response.user?.role?.name;
    if (isAdminRoleName(roleName)) {
      router.replace("/dashboard");
    } else if (isEmployeeRoleName(roleName)) {
      router.replace("/employee/orders");
    } else {
      router.replace("/");
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-8 text-right text-4xl font-bold text-[var(--black-300)]">
        {t("authPages.login.title")}
      </h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-right text-sm font-medium">
            {t("authPages.fields.email")}
          </label>
          <Input
            id="email"
            type="email"
            placeholder={t("authPages.login.emailPlaceholder")}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((previous) => ({
                ...previous,
                email: undefined,
                general: undefined,
              }));
            }}
            required
            className={`text-right ${
              errors.email ? "border-[var(--danger)] focus-visible:ring-[var(--danger)]" : ""
            }`}
          />
          {errors.email ? (
            <p className="text-right text-xs text-[var(--danger)]">{errors.email}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-right text-sm font-medium"
          >
            {t("authPages.fields.password")}
          </label>
          <PasswordInput
            id="password"
            placeholder={t("authPages.login.passwordPlaceholder")}
            value={password}
            minLength={8}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((previous) => ({
                ...previous,
                password: undefined,
                general: undefined,
              }));
            }}
            required
            className={`text-right ${
              errors.password
                ? "border-[var(--danger)] focus-visible:ring-[var(--danger)]"
                : ""
            }`}
          />
          {errors.password ? (
            <p className="text-right text-xs text-[var(--danger)]">{errors.password}</p>
          ) : null}
        </div>
        {errors.general ? (
          <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-right text-sm text-[var(--danger)]">
            {errors.general}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("authPages.login.submitting") : t("authPages.login.submit")}
        </Button>
      </form>
      <p className="mt-5 text-right text-sm text-[var(--black-200)]">
        {t("authPages.login.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-[var(--primary-400)] hover:underline">
          {t("authPages.login.createAccount")}
        </Link>
      </p>
    </div>
  );
}
