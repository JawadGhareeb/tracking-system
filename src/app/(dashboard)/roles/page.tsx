"use client";

import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRoles } from "@/hook/use-roles";
import { Icons } from "@/lib/icons";
import { IRole, RoleGroup } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IRoleFormState {
  name: string;
  description: string;
  group: RoleGroup;
}

const defaultRoleFormState: IRoleFormState = {
  name: "",
  description: "",
  group: "EMPLOYEE",
};

function normalizeRoleFormState(form: IRoleFormState): IRoleFormState {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    group: form.group,
  };
}

function validateRoleFormState(
  form: IRoleFormState,
  t: (key: string) => string
): string | null {
  const normalizedName = form.name.trim();
  const normalizedDescription = form.description.trim();

  if (!normalizedName) {
    return t("dashboardRoles.validation.nameRequired");
  }

  if (normalizedName.length < 2) {
    return t("dashboardRoles.validation.nameMin");
  }

  if (normalizedName.length > 50) {
    return t("dashboardRoles.validation.nameMax");
  }

  if (normalizedDescription.length > 200) {
    return t("dashboardRoles.validation.descriptionMax");
  }

  return null;
}

export default function RolesPage() {
  const { t } = useTranslation();
  const {
    roles,
    isLoading,
    isMutating,
    error,
    getRoleById,
    createRole,
    updateRole,
    removeRole,
  } = useRoles();

  const safeRoles = Array.isArray(roles) ? roles : [];

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [isLoadingRoleDetails, setIsLoadingRoleDetails] = useState(false);

  const [createForm, setCreateForm] = useState<IRoleFormState>(defaultRoleFormState);
  const [editForm, setEditForm] = useState<IRoleFormState>(defaultRoleFormState);

  const [createValidationError, setCreateValidationError] = useState<string | null>(null);
  const [createSubmitError, setCreateSubmitError] = useState<string | null>(null);
  const [editValidationError, setEditValidationError] = useState<string | null>(null);
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);

  const openCreateDialog = () => {
    setCreateForm(defaultRoleFormState);
    setCreateValidationError(null);
    setCreateSubmitError(null);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = async (role: IRole) => {
    setEditingRoleId(role._id);
    setIsEditDialogOpen(true);
    setIsLoadingRoleDetails(true);
    setEditValidationError(null);
    setEditSubmitError(null);

    try {
      const roleDetails = await getRoleById(role._id);
      setEditForm({
        name: roleDetails.name,
        description: roleDetails.description,
        group: roleDetails.group || "EMPLOYEE",
      });
    } catch (requestError) {
      setEditSubmitError(
        requestError instanceof Error ? requestError.message : t("dashboardRoles.loadRoleFailed")
      );
    } finally {
      setIsLoadingRoleDetails(false);
    }
  };

  const openDeleteDialog = (role: IRole) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCreateValidationError(null);
    setCreateSubmitError(null);

    const validationError = validateRoleFormState(createForm, (key) => t(key));
    if (validationError) {
      setCreateValidationError(validationError);
      return;
    }

    try {
      await createRole(normalizeRoleFormState(createForm));
      setCreateForm(defaultRoleFormState);
      setIsCreateDialogOpen(false);
    } catch (requestError) {
      setCreateSubmitError(
        requestError instanceof Error ? requestError.message : t("dashboardRoles.createFailed")
      );
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingRoleId) {
      setEditSubmitError(t("dashboardRoles.editUnavailable"));
      return;
    }

    setEditValidationError(null);
    setEditSubmitError(null);

    const validationError = validateRoleFormState(editForm, (key) => t(key));
    if (validationError) {
      setEditValidationError(validationError);
      return;
    }

    try {
      await updateRole(editingRoleId, normalizeRoleFormState(editForm));
      setIsEditDialogOpen(false);
      setEditingRoleId(null);
    } catch (requestError) {
      setEditSubmitError(
        requestError instanceof Error ? requestError.message : t("dashboardRoles.updateFailed")
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRole) {
      return;
    }

    try {
      await removeRole(selectedRole._id);
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
    } catch {
      // handled in hook toast + error state
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 text-[var(--primary-300)]">
        <Icons.briefcase className="h-6 w-6" />
        <span className="text-sm font-semibold uppercase tracking-wide text-[var(--primary-400)]">
          {t("dashboardRoles.badge")}
        </span>
      </div>

      <div className="my-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--black-300)]">{t("dashboardRoles.title")}</h1>
          <p className="text-sm text-[var(--black-100)]">{t("dashboardRoles.description")}</p>
        </div>
        <Button className="self-start gap-2" onClick={openCreateDialog}>
          <Icons.add className="h-4 w-4" />
          {t("dashboardRoles.addRole")}
        </Button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <Card className="p-0">
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboardRoles.table.name")}</TableHead>
                <TableHead>{t("dashboardRoles.table.description")}</TableHead>
                <TableHead>{t("dashboardRoles.table.createdAt")}</TableHead>
                <TableHead className="text-center">{t("dashboardRoles.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={`roles-skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-56" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : safeRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    {t("dashboardRoles.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                safeRoles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell className="font-semibold">{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            void openEditDialog(role);
                          }}
                          aria-label={t("dashboardRoles.aria.editRole")}
                        >
                          <Icons.edit className="h-5 w-5 text-[var(--primary-300)]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(role)}
                          aria-label={t("dashboardRoles.aria.deleteRole")}
                        >
                          <Icons.delete className="h-5 w-5 text-[var(--danger)]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setCreateForm(defaultRoleFormState);
            setCreateValidationError(null);
            setCreateSubmitError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboardRoles.createDialog.title")}</DialogTitle>
            <DialogDescription>{t("dashboardRoles.createDialog.description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void handleCreateSubmit(event)} className="space-y-4">
            {createValidationError ? (
              <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                {createValidationError}
              </p>
            ) : null}
            {createSubmitError ? (
              <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                {createSubmitError}
              </p>
            ) : null}
            <div className="space-y-2">
              <label htmlFor="create-role-name" className="text-sm font-medium">
                {t("dashboardRoles.fields.name")}
              </label>
              <Input
                id="create-role-name"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">{t("dashboardRoles.fields.group", { defaultValue: "نوع الدور" })}</label><Select value={createForm.group} onValueChange={(value) => setCreateForm((previous) => ({ ...previous, group: value as RoleGroup }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="EMPLOYEE">Employee</SelectItem><SelectItem value="CUSTOMER">Customer</SelectItem></SelectContent></Select></div>
            <div className="space-y-2">
              <label htmlFor="create-role-description" className="text-sm font-medium">
                {t("dashboardRoles.fields.description")}
              </label>
              <Input
                id="create-role-description"
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isMutating}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isMutating}>
                {t("common.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingRoleId(null);
            setEditValidationError(null);
            setEditSubmitError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboardRoles.editDialog.title")}</DialogTitle>
            <DialogDescription>{t("dashboardRoles.editDialog.description")}</DialogDescription>
          </DialogHeader>
          {isLoadingRoleDetails ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          ) : (
            <form onSubmit={(event) => void handleEditSubmit(event)} className="space-y-4">
              {editValidationError ? (
                <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                  {editValidationError}
                </p>
              ) : null}
              {editSubmitError ? (
                <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                  {editSubmitError}
                </p>
              ) : null}
              <div className="space-y-2">
                <label htmlFor="edit-role-name" className="text-sm font-medium">
                  {t("dashboardRoles.fields.name")}
                </label>
                <Input
                  id="edit-role-name"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">{t("dashboardRoles.fields.group", { defaultValue: "نوع الدور" })}</label><Select value={editForm.group} onValueChange={(value) => setEditForm((previous) => ({ ...previous, group: value as RoleGroup }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="EMPLOYEE">Employee</SelectItem><SelectItem value="CUSTOMER">Customer</SelectItem></SelectContent></Select></div>
              <div className="space-y-2">
                <label htmlFor="edit-role-description" className="text-sm font-medium">
                  {t("dashboardRoles.fields.description")}
                </label>
                <Input
                  id="edit-role-description"
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isMutating}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isMutating || isLoadingRoleDetails}>
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setSelectedRole(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboardRoles.deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("dashboardRoles.deleteDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isMutating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDeleteConfirm();
              }}
              disabled={isMutating}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
