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
import { useOrders } from "@/hook/use-orders";
import { useUsers } from "@/hook/use-users";
import {
  createCreateOrderFormSchema,
  type CreateOrderFormValues,
} from "../schema";

function splitCommaValues(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toOptionalTrimmedString(value?: string) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export default function NewOrderPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { createOrder, isMutating } = useOrders();
  const {
    users,
    isLoading: isUsersLoading,
    error: usersError,
  } = useUsers({ page: 1, perPage: 100 });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const orderStatuses = [
    { value: "PENDING", label: t("orderStatus.pending") },
    { value: "CUTTING", label: t("orderStatus.cutting") },
    { value: "SEWING", label: t("orderStatus.sewing") },
    { value: "PRINTING", label: t("orderStatus.printing") },
    { value: "PACKAGING", label: t("orderStatus.packaging") },
    { value: "STORAGE", label: t("orderStatus.storage") },
    { value: "DELIVERY", label: t("orderStatus.delivery") },
  ];

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user._id,
        label: `${user.fullName.firstName} ${user.fullName.lastName}`,
      })),
    [users]
  );
  const createOrderFormSchema = useMemo(
    () => createCreateOrderFormSchema((key) => t(key)),
    [t]
  );

  const form = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: {
      customer: "",
      employee: "",
      description: "",
      status: "PENDING",
      expectedFinishDate: "",
      cost: "",
      sizes: "",
      colors: "",
      address: "",
      city: "",
      notes: "",
    },
  });

  const onSubmit = async (values: CreateOrderFormValues) => {
    setValidationError(null);
    setSubmitError(null);

    const sizes = splitCommaValues(values.sizes);
    const colors = splitCommaValues(values.colors);
    const city = toOptionalTrimmedString(values.city);
    const notes = toOptionalTrimmedString(values.notes);

    try {
      await createOrder({
        customer: values.customer,
        employee: values.employee,
        description: values.description.trim(),
        status: values.status,
        expectedFinishDate: new Date(values.expectedFinishDate).toISOString(),
        cost: Number(values.cost),
        ...(sizes.length > 0 ? { sizes } : {}),
        ...(colors.length > 0 ? { colors } : {}),
        deliveryLocation: {
          address: values.address.trim(),
          ...(city ? { city } : {}),
          ...(notes ? { notes } : {}),
        },
      });

      router.push("/orders");
    } catch (requestError) {
      setSubmitError(requestError instanceof Error ? requestError.message : t("orderForm.saveFailed"));
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <Icons.leftArrow className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-[var(--black-300)]">{t("orderForm.newTitle")}</h1>
      </div>

      <Card className="max-w-5xl border-none bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{t("orderForm.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {usersError ? (
            <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
              {usersError}
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
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.customer")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        disabled={isUsersLoading || userOptions.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isUsersLoading
                                  ? t("orderForm.loadingUsers")
                                  : t("orderForm.selectCustomer")
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isUsersLoading ? (
                            <SelectItem value="users-loading-customer" disabled>
                              {t("orderForm.loadingUsers")}
                            </SelectItem>
                          ) : userOptions.length === 0 ? (
                            <SelectItem value="users-empty-customer" disabled>
                              {t("orderForm.noAccounts")}
                            </SelectItem>
                          ) : (
                            userOptions.map((user) => (
                              <SelectItem key={user.value} value={user.value}>
                                {user.label}
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
                  name="employee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.employee")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        disabled={isUsersLoading || userOptions.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isUsersLoading
                                  ? t("orderForm.loadingUsers")
                                  : t("orderForm.selectEmployee")
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isUsersLoading ? (
                            <SelectItem value="users-loading-employee" disabled>
                              {t("orderForm.loadingUsers")}
                            </SelectItem>
                          ) : userOptions.length === 0 ? (
                            <SelectItem value="users-empty-employee" disabled>
                              {t("orderForm.noAccounts")}
                            </SelectItem>
                          ) : (
                            userOptions.map((user) => (
                              <SelectItem key={user.value} value={user.value}>
                                {user.label}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.description")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("orderForm.placeholders.description")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.status")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("orderForm.selectStatus")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orderStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedFinishDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.expectedFinishDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.cost")}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sizes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.sizes")}</FormLabel>
                      <FormControl>
                        <Input placeholder="M, L, XL" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="colors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.colors")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("orderForm.placeholders.colors")} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.address")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("orderForm.placeholders.address")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.city")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("orderForm.placeholders.city")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderForm.fields.notes")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("orderForm.placeholders.notes")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-start sm:gap-4">
                <Button type="submit" disabled={form.formState.isSubmitting || isMutating}>
                  {form.formState.isSubmitting || isMutating ? t("common.saving") : t("common.save")}
                </Button>
                <Link href="/orders" className="w-full sm:w-auto">
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
