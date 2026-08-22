"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  createEmployeeFormSchema,
  type EmployeeFormValues,
} from "../schema";

export default function NewEmployeePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { createUser, isMutating } = useUsers();
  const { roles, isLoading: rolesLoading, error: rolesError } = useRoles();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role._id, label: role.name })),
    [roles]
  );
  const employeeFormSchema = useMemo(
    () => createEmployeeFormSchema((key) => t(key)),
    [t]
  );

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      role: "",
    },
  });

  const onSubmit = async (values: EmployeeFormValues) => {
    setValidationError(null);
    setSubmitError(null);

    try {
      await createUser({
        fullName: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
        },
        email: values.email.trim(),
        username: values.username.trim(),
        password: values.password,
        role: values.role,
      });

      router.push("/employees");
    } catch (requestError) {
      setSubmitError(
        requestError instanceof Error ? requestError.message : t("employeeForm.saveFailed")
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
        <h1 className="text-3xl font-bold text-[var(--black-300)]">{t("employeeForm.newTitle")}</h1>
      </div>

      <Card className="max-w-5xl border-none bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{t("employeeForm.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {rolesError ? (
            <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
              {rolesError}
            </div>
          ) : null}

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
                        <Input placeholder={t("employeeForm.placeholders.firstName")} {...field} />
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
                        <Input placeholder={t("employeeForm.placeholders.lastName")} {...field} />
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
                        <Input type="email" placeholder={t("employeeForm.placeholders.email")} {...field} />
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
                        <Input placeholder={t("employeeForm.placeholders.username")} {...field} />
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
                      <FormLabel>{t("employeeForm.fields.password")}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={t("employeeForm.placeholders.password")} {...field} />
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
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-start sm:gap-4">
                <Button type="submit" disabled={form.formState.isSubmitting || isMutating}>
                  {form.formState.isSubmitting || isMutating ? t("common.saving") : t("common.save")}
                </Button>
                <Link href="/employees" className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full">
                    {t("common.cancel")}
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
