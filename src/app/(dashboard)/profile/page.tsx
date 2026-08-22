"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authApiService } from "@/services/api.auth.service";
import { usersApiService } from "@/services/api.users.service";
import { normalizeUser } from "@/lib/normalize-api";
import { useToast } from "@/components/ui/toast";
import { type IUpdateUserPayload } from "@/types";
import { createProfileFormSchema, type ProfileFormValues } from "./schema";

function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`profile-form-skeleton-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-11 w-full" />
      </div>
      <Skeleton className="h-11 w-40" />
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { success: showSuccessToast } = useToast();
  const [userId, setUserId] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const profileFormSchema = useMemo(
    () => createProfileFormSchema((key) => t(key)),
    [t]
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setLoadError(null);

      try {
        const response = await authApiService.me();
        const user = normalizeUser(response);

        if (cancelled) {
          return;
        }

        setUserId(user._id);
        form.reset({
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
          email: user.email,
          username: user.username,
          password: "",
        });
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("dashboardProfile.loadFailed")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [form, t]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!userId) {
      setSubmitError(t("dashboardProfile.userNotFound"));
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    const payload: IUpdateUserPayload = {
      fullName: {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      },
      email: values.email.trim(),
      username: values.username.trim(),
    };

    if (values.password && values.password.trim().length > 0) {
      payload.password = values.password.trim();
    }

    try {
      const updated = await usersApiService.update(userId, payload);
      const normalizedUpdated = normalizeUser(updated, userId);

      form.reset({
        firstName: normalizedUpdated.fullName.firstName,
        lastName: normalizedUpdated.fullName.lastName,
        email: normalizedUpdated.email,
        username: normalizedUpdated.username,
        password: "",
      });

      showSuccessToast({
        title: t("dashboardProfile.updateSuccessTitle"),
        description: t("dashboardProfile.updateSuccessDescription"),
      });
    } catch (requestError) {
      setSubmitError(
        requestError instanceof Error ? requestError.message : t("dashboardProfile.updateFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--black-300)]">{t("dashboardProfile.title")}</h1>
        <p className="mt-2 text-sm text-[var(--black-200)]">
          {t("dashboardProfile.description")}
        </p>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {loadError}
        </div>
      ) : null}

      <Card className="max-w-4xl border-none bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{t("dashboardProfile.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProfile ? (
            <ProfileFormSkeleton />
          ) : loadError ? (
            <p className="text-sm text-[var(--black-200)]">
              {t("dashboardProfile.retryMessage")}
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
                        <FormLabel>{t("dashboardProfile.fields.firstName")}</FormLabel>
                        <FormControl>
                          <Input {...field} dir="rtl" />
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
                        <FormLabel>{t("dashboardProfile.fields.lastName")}</FormLabel>
                        <FormControl>
                          <Input {...field} dir="rtl" />
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
                        <FormLabel>{t("dashboardProfile.fields.email")}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} dir="ltr" />
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
                        <FormLabel>{t("dashboardProfile.fields.username")}</FormLabel>
                        <FormControl>
                          <Input {...field} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("dashboardProfile.fields.passwordOptional")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          value={field.value ?? ""}
                          dir="ltr"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--primary-300)] hover:bg-[var(--primary-400)]"
                >
                  {isSubmitting ? t("common.saving") : t("dashboardProfile.save")}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
