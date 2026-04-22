"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Search,
  Shield,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { adminApi } from "@/lib/api/admin";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import type { AccountStatus, Admin } from "@/lib/types";

const statusOptions: { value: AccountStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "deactive", label: "Deactive" },
];

const readNonEmpty = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getAdminDisplayName = (admin: Admin) => {
  const adminRecord = admin as unknown as Record<string, unknown>;

  const directName = readNonEmpty(admin.name);
  if (directName) return directName;

  const fullName = readNonEmpty(adminRecord.fullName) || readNonEmpty(adminRecord.full_name);
  if (fullName) return fullName;

  const firstName = readNonEmpty(adminRecord.firstName) || readNonEmpty(adminRecord.first_name);
  const lastName = readNonEmpty(adminRecord.lastName) || readNonEmpty(adminRecord.last_name);
  const combinedName = `${firstName} ${lastName}`.trim();
  if (combinedName) return combinedName;

  const username = readNonEmpty(adminRecord.username) || readNonEmpty(adminRecord.userName);
  if (username) return username;

  const email = readNonEmpty(admin.email);
  if (email) return email.split("@")[0];

  return "Unknown Admin";
};

const getAdminListKey = (admin: Admin, index: number) => {
  const adminRecord = admin as unknown as Record<string, unknown>;
  const id = readNonEmpty(admin.id) || readNonEmpty(adminRecord._id);
  if (id) return `admin-${id}`;

  const email = readNonEmpty(admin.email);
  if (email) return `admin-email-${email}-${index}`;

  return `admin-fallback-${index}`;
};

const adminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type AdminFormData = z.infer<typeof adminSchema>;

function AdminCard({
  admin,
  onEdit,
  onDelete,
}: {
  admin: Admin;
  onEdit: (admin: Admin) => void;
  onDelete: (id: string) => void;
}) {
  const getInitials = (name: string) => {
    const safeName = name.trim() || "Unknown Admin";
    return safeName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = getAdminDisplayName(admin);
  const displayEmail = admin.email || "No email";

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{displayName}</CardTitle>
              <CardDescription className="text-xs">{displayEmail}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(admin)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(admin.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Administrator</span>
        </div>
        {admin.createdAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Added {format(new Date(admin.createdAt), "MMM d, yyyy")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AdminForm({
  admin,
  onSubmit,
  onCancel,
  isLoading,
}: {
  admin?: Admin;
  onSubmit: (data: AdminFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: admin ? getAdminDisplayName(admin) : "",
      email: admin?.email || "",
      password: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="Enter name"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password {admin ? "(leave blank to keep current)" : "*"}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder={admin ? "Enter new password" : "Enter password"}
            {...register("password")}
            className={errors.password ? "border-destructive pr-10" : "pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {admin ? "Update Admin" : "Create Admin"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminAdminsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus>("active");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admins", statusFilter],
    queryFn: () => adminApi.getAll(statusFilter),
  });

  const createMutation = useMutation({
    mutationFn: adminApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin created successfully");
      setShowCreateDialog(false);
    },
    onError: () => {
      toast.error("Failed to create admin");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminFormData> }) =>
      adminApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin updated successfully");
      setEditAdmin(null);
    },
    onError: () => {
      toast.error("Failed to update admin");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin deleted successfully");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete admin");
    },
  });

  const admins = data?.data || [];
  const searchTerm = search.toLowerCase();
  const filteredAdmins = admins.filter((admin) => {
    const name = getAdminDisplayName(admin).toLowerCase();
    const email = (admin.email || "").toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  const handleCreateSubmit = (data: AdminFormData) => {
    createMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password || "",
    });
  };

  const handleEditSubmit = (data: AdminFormData) => {
    if (!editAdmin) return;
    const payload: Partial<AdminFormData> = {
      name: data.name,
      email: data.email,
    };
    if (data.password) {
      payload.password = data.password;
    }
    updateMutation.mutate({ id: editAdmin.id, data: payload });
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load admins</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admins"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administrators</h1>
          <p className="text-muted-foreground">
            Manage admin accounts for the platform
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as AccountStatus)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filteredAdmins.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={Shield}
              title={search ? "No matching admins" : "No admins yet"}
              description={
                search
                  ? "Try adjusting your search"
                  : "Add your first administrator to the platform"
              }
              action={
                !search && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Admin
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAdmins.map((admin, index) => (
            <AdminCard
              key={getAdminListKey(admin, index)}
              admin={admin}
              onEdit={setEditAdmin}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
            <DialogDescription>
              Create a new admin account with full platform access
            </DialogDescription>
          </DialogHeader>
          <AdminForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editAdmin} onOpenChange={(open) => !open && setEditAdmin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Administrator</DialogTitle>
            <DialogDescription>Update admin account details</DialogDescription>
          </DialogHeader>
          {editAdmin && (
            <AdminForm
              admin={editAdmin}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditAdmin(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Administrator"
        description="Are you sure you want to delete this admin? They will lose all platform access."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
