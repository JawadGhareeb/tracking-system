"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hook/use-auth";
import { ROLE_IDS } from "@/constant/roles";

const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,}$/;

interface IRegisterErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<IRegisterErrors>({});

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: IRegisterErrors = {};
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!normalizedFirstName) {
      nextErrors.firstName = t("authPages.validation.firstNameRequired");
    }

    if (!normalizedLastName) {
      nextErrors.lastName = t("authPages.validation.lastNameRequired");
    }

    if (!normalizedUsername) {
      nextErrors.username = t("authPages.validation.usernameRequired");
    } else if (normalizedUsername.length < 2) {
      nextErrors.username = t("authPages.validation.usernameMin");
    }

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
    } else if (!STRONG_PASSWORD_REGEX.test(normalizedPassword)) {
      nextErrors.password = t("authPages.validation.passwordStrong");
    }

    if (!normalizedConfirmPassword) {
      nextErrors.confirmPassword = t("authPages.validation.confirmPasswordRequired");
    } else if (normalizedConfirmPassword !== normalizedPassword) {
      nextErrors.confirmPassword = t("authPages.validation.confirmPasswordMismatch");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const response = await register({
      fullName: {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      },
      email: normalizedEmail,
      username: normalizedUsername,
      password: normalizedPassword,
      role: ROLE_IDS.USER,
    });

    if (!response.success) {
      setErrors({
        general: response.error ?? t("authPages.register.generalError"),
      });
      return;
    }

    router.replace("/");
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-8 text-right text-4xl font-bold text-[var(--black-300)]">
        {t("authPages.register.title")}
      </h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-right text-sm font-medium">
              {t("authPages.fields.firstName")}
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder={t("authPages.register.firstNamePlaceholder")}
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                setErrors((previous) => ({ ...previous, firstName: undefined, general: undefined }));
              }}
              required
              className={`text-right ${
                errors.firstName ? "border-[var(--danger)] focus-visible:ring-[var(--danger)]" : ""
              }`}
            />
            {errors.firstName ? <p className="text-right text-xs text-[var(--danger)]">{errors.firstName}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-right text-sm font-medium">
              {t("authPages.fields.lastName")}
            </label>
            <Input
              id="lastName"
              type="text"
              placeholder={t("authPages.register.lastNamePlaceholder")}
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                setErrors((previous) => ({ ...previous, lastName: undefined, general: undefined }));
              }}
              required
              className={`text-right ${
                errors.lastName ? "border-[var(--danger)] focus-visible:ring-[var(--danger)]" : ""
              }`}
            />
            {errors.lastName ? <p className="text-right text-xs text-[var(--danger)]">{errors.lastName}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="username" className="block text-right text-sm font-medium">
            {t("authPages.fields.username")}
          </label>
          <Input
            id="username"
            type="text"
            placeholder={t("authPages.register.usernamePlaceholder")}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setErrors((previous) => ({ ...previous, username: undefined, general: undefined }));
            }}
            required
            className={`text-right ${
              errors.username ? "border-[var(--danger)] focus-visible:ring-[var(--danger)]" : ""
            }`}
          />
          {errors.username ? <p className="text-right text-xs text-[var(--danger)]">{errors.username}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-right text-sm font-medium">
            {t("authPages.fields.email")}
          </label>
          <Input
            id="email"
            type="email"
            placeholder={t("authPages.register.emailPlaceholder")}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((previous) => ({ ...previous, email: undefined, general: undefined }));
            }}
            required
            className={`text-right ${
              errors.email ? "border-[var(--danger)] focus-visible:ring-[var(--danger)]" : ""
            }`}
          />
          {errors.email ? <p className="text-right text-xs text-[var(--danger)]">{errors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-right text-sm font-medium">
            {t("authPages.fields.password")}
          </label>
          <PasswordInput
            id="password"
            placeholder={t("authPages.register.passwordPlaceholder")}
            value={password}
            minLength={8}
            pattern="^(?=.*[A-Z])(?=.*[^A-Za-z0-9\\s]).{8,}$"
            title={t("authPages.validation.passwordStrong")}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((previous) => ({ ...previous, password: undefined, general: undefined }));
            }}
            required
            className={`text-right ${
              errors.password
                ? "border-[var(--danger)] focus-visible:ring-[var(--danger)]"
                : ""
            }`}
          />
          {errors.password ? <p className="text-right text-xs text-[var(--danger)]">{errors.password}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-right text-sm font-medium">
            {t("authPages.fields.confirmPassword")}
          </label>
          <PasswordInput
            id="confirmPassword"
            placeholder={t("authPages.register.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((previous) => ({ ...previous, confirmPassword: undefined, general: undefined }));
            }}
            required
            className={`text-right ${
              errors.confirmPassword
                ? "border-[var(--danger)] focus-visible:ring-[var(--danger)]"
                : ""
            }`}
          />
          {errors.confirmPassword ? (
            <p className="text-right text-xs text-[var(--danger)]">{errors.confirmPassword}</p>
          ) : null}
        </div>

        {errors.general ? (
          <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-right text-sm text-[var(--danger)]">
            {errors.general}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("authPages.register.submitting") : t("authPages.register.submit")}
        </Button>
      </form>

      <p className="mt-5 text-right text-sm text-[var(--black-200)]">
        {t("authPages.register.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-[var(--primary-400)] hover:underline">
          {t("authPages.register.login")}
        </Link>
      </p>
    </div>
  );
}
