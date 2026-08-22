"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icons } from "@/lib/icons";
import { useUsers } from "@/hook/use-users";
import { useRoles } from "@/hook/use-roles";
import { normalizeUser } from "@/lib/normalize-api";
import { usersApiService } from "@/services/api.users.service";
import { IUpdateUserPayload } from "@/types";
import {
  createEditEmployeeFormSchema,
  type EditEmployeeFormValues,
} from "../schema";

function EditEmployeeFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={`employee-form-skeleton-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 w-24" />
        <Skeleton className="h-11 w-24" />
      </div>
    </div>
  );
}

function toOptionalTrimmedString(value?: string) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export default function EditEmployeePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const { updateUser, isMutating } = useUsers();
  const { roles, isLoading: rolesLoading, error: rolesError } = useRoles();

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role._id, label: role.name })),
    [roles]
  );
  const editEmployeeFormSchema = useMemo(
    () => createEditEmployeeFormSchema((key) => t(key)),
    [t]
  );

  const form = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      role: "",
      salary: "",
      isActive: "true",
    },
  });

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      setIsLoadingUser(true);
      setLoadError(null);

      try {
        const response = await usersApiService.getById(employeeId);
        const user = normalizeUser(response, employeeId);
        if (cancelled) {
          return;
        }

        form.reset({
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
          email: user.email,
          username: user.username,
          password: "",
          role: user.role._id,
          salary: String(user.salary),
          isActive: user.isActive ? "true" : "false",
        });
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("employeeForm.loadFailed")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUser(false);
        }
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [employeeId, form, t]);

  const onSubmit = async (values: EditEmployeeFormValues) => {
    setValidationError(null);
    setSubmitError(null);

    const firstName = toOptionalTrimmedString(values.firstName);
    const lastName = toOptionalTrimmedString(values.lastName);
    const email = toOptionalTrimmedString(values.email);
    const username = toOptionalTrimmedString(values.username);
    const role = toOptionalTrimmedString(values.role);
    const payload: IUpdateUserPayload = {};

    if (firstName || lastName) {
      payload.fullName = {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
      };
    }

    if (email) {
      payload.email = email;
    }

    if (username) {
      payload.username = username;
    }

    if (values.password) {
      payload.password = values.password;
    }

    if (role) {
      payload.role = role;
    }

    if (values.salary !== undefined) {
      payload.salary = Number(values.salary);
    }

    if (values.isActive !== undefined) {
      payload.isActive = values.isActive === "true";
    }

    try {
      await updateUser(employeeId, payload);

      router.push("/employees");
    } catch (requestError) {
      setSubmitError(
        requestError instanceof Error ? requestError.message : t("employeeForm.updateFailed")
      );
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <Icons.leftArrow className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-[var(--black-300)]">{t("employeeForm.editTitle")}</h1>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {loadError}
        </div>
      ) : null}

      {rolesError ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {rolesError}
        </div>
      ) : null}

      <Card className="max-w-5xl border-none bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{t("employeeForm.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUser ? (
            <EditEmployeeFormSkeleton />
          ) : loadError ? (
            <p className="text-sm text-[var(--black-200)]">
              {t("employeeForm.retryMessage")}
            </p>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  (values) => {
                    void onSubmit(values);
                  },
                  () => {
                    setSubmitError(null);
                    setValidationError(t("dashboardProfile.validationError"));
                  }
                )}
                className="space-y-6 text-right"
                noValidate
              >
                {validationError ? (
                  <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
                    {validationError}
                  </div>
                ) : null}
                {submitError ? (
                  <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
                    {submitError}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeForm.fields.firstName")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeForm.fields.lastName")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeForm.fields.email")}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeForm.fields.username")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeForm.fields.passwordOptional")}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t("employeeForm.placeholders.keepCurrentPassword")}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeForm.fields.salary")}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeForm.fields.role")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                          disabled={rolesLoading || roleOptions.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  rolesLoading
                                    ? t("employeeForm.loadingRoles")
                                    : t("employeeForm.selectRole")
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rolesLoading ? (
                              <SelectItem value="roles-loading" disabled>
                                {t("employeeForm.loadingRoles")}
                              </SelectItem>
                            ) : roleOptions.length === 0 ? (
                              <SelectItem value="no-roles" disabled>
                                {t("employeeForm.noRoles")}
                              </SelectItem>
                            ) : (
                              roleOptions.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("employeeForm.fields.status")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("employeeForm.selectStatus")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">{t("dashboardUsers.statusActive")}</SelectItem>
                            <SelectItem value="false">{t("dashboardUsers.statusInactive")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-start sm:gap-4">
                  <Button type="submit" disabled={form.formState.isSubmitting || isMutating}>
                    {form.formState.isSubmitting || isMutating
                      ? t("common.saving")
                      : t("dashboardProfile.save")}
                  </Button>
                  <Link href="/employees" className="w-full sm:w-auto">
                    <Button type="button" variant="outline" className="w-full">
                      {t("common.cancel")}
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
