"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
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
import { useOrders } from "@/hook/use-orders";
import { useUsers } from "@/hook/use-users";
import { normalizeOrder } from "@/lib/normalize-api";
import { ordersApiService } from "@/services/api.orders.service";
import { IUpdateOrderPayload } from "@/types";
import {
  createEditOrderFormSchema,
  type EditOrderFormValues,
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

function EditOrderFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 11 }, (_, index) => (
          <div key={`order-form-skeleton-${index}`} className="space-y-2">
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

export default function EditOrderPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const { updateOrder, isMutating } = useOrders();
  const {
    users,
    isLoading: isUsersLoading,
    error: usersError,
  } = useUsers({ page: 1, perPage: 100 });

  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const orderStatuses = [
    { value: "PENDING", label: t("orderStatus.pending") },
    { value: "IN_PROGRESS", label: t("orderStatus.inProgress") },
    { value: "COMPLETED", label: t("orderStatus.completed") },
    { value: "CANCELLED", label: t("orderStatus.cancelled") },
  ];

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user._id,
        label: `${user.fullName.firstName} ${user.fullName.lastName}`,
      })),
    [users]
  );
  const editOrderFormSchema = useMemo(
    () => createEditOrderFormSchema((key) => t(key)),
    [t]
  );

  const form = useForm<EditOrderFormValues>({
    resolver: zodResolver(editOrderFormSchema),
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

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      setIsLoadingOrder(true);
      setLoadError(null);

      try {
        const response = await ordersApiService.getById(orderId);
        const order = normalizeOrder(response, orderId);
        if (cancelled) {
          return;
        }

        form.reset({
          customer: order.customer._id,
          employee: order.employee._id,
          description: order.description,
          status: order.status,
          expectedFinishDate: dayjs(order.expectedFinishDate).format("YYYY-MM-DD"),
          cost: String(order.cost),
          sizes: order.sizes.join(", "),
          colors: order.colors.join(", "),
          address: order.deliveryLocation?.address || "",
          city: order.deliveryLocation?.city || "",
          notes: order.deliveryLocation?.notes || "",
        });
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(requestError instanceof Error ? requestError.message : t("orderForm.loadFailed"));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOrder(false);
        }
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [form, orderId, t]);

  const onSubmit = async (values: EditOrderFormValues) => {
    setValidationError(null);
    setSubmitError(null);

    const payload: IUpdateOrderPayload = {};
    const description = toOptionalTrimmedString(values.description);
    const expectedFinishDate = values.expectedFinishDate;
    const sizes = splitCommaValues(values.sizes);
    const colors = splitCommaValues(values.colors);
    const address = toOptionalTrimmedString(values.address);
    const city = toOptionalTrimmedString(values.city);
    const notes = toOptionalTrimmedString(values.notes);

    if (description) {
      payload.description = description;
    }

    if (values.status) {
      payload.status = values.status;
    }

    if (expectedFinishDate) {
      payload.expectedFinishDate = new Date(expectedFinishDate).toISOString();
    }

    if (values.cost !== undefined) {
      payload.cost = Number(values.cost);
    }

    if (sizes.length > 0) {
      payload.sizes = sizes;
    }

    if (colors.length > 0) {
      payload.colors = colors;
    }

    if (address || city || notes) {
      payload.deliveryLocation = {
        ...(address ? { address } : {}),
        ...(city ? { city } : {}),
        ...(notes ? { notes } : {}),
      };
    }

    try {
      await updateOrder(orderId, payload);

      router.push("/orders");
    } catch (requestError) {
      setSubmitError(requestError instanceof Error ? requestError.message : t("orderForm.updateFailed"));
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
        <h1 className="text-3xl font-bold text-[var(--black-300)]">{t("orderForm.editTitle")}</h1>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {loadError}
        </div>
      ) : null}

      {usersError ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {usersError}
        </div>
      ) : null}

      <Card className="max-w-5xl border-none bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{t("orderForm.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOrder ? (
            <EditOrderFormSkeleton />
          ) : loadError ? (
            <p className="text-sm text-[var(--black-200)]">
              {t("orderForm.retryMessage")}
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
                    name="customer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orderForm.fields.customer")}</FormLabel>
                        <Select value={field.value || undefined} disabled>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isUsersLoading
                                    ? t("orderForm.loadingUsers")
                                    : t("orderForm.fields.customer")
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {userOptions.map((user) => (
                              <SelectItem key={user.value} value={user.value}>
                                {user.label}
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
                    name="employee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orderForm.fields.employee")}</FormLabel>
                        <Select value={field.value || undefined} disabled>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isUsersLoading
                                    ? t("orderForm.loadingUsers")
                                    : t("orderForm.fields.employee")
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {userOptions.map((user) => (
                              <SelectItem key={user.value} value={user.value}>
                                {user.label}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orderForm.fields.description")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input type="number" {...field} />
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
                          <Input {...field} value={field.value || ""} />
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
                          <Input {...field} value={field.value || ""} />
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
                          <Input {...field} />
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
                          <Input {...field} />
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
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
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
                  <Link href="/orders" className="w-full sm:w-auto">
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
