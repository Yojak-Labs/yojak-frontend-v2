"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usersApi } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  Shield,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  GraduationCap,
} from "lucide-react";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { UpdateUserRequest } from "@/lib/types";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const isAdmin = user?.role === "admin";
  const userRecord = (user ?? {}) as Record<string, unknown>;

  const normalizedCollege =
    user?.college ??
    (typeof userRecord.college === "string" ? userRecord.college : null) ??
    (typeof userRecord.college_name === "string" ? userRecord.college_name : null) ??
    "";
  const normalizedCompany =
    user?.company ??
    (typeof userRecord.company === "string" ? userRecord.company : null) ??
    (typeof userRecord.company_name === "string" ? userRecord.company_name : null) ??
    "";
  const normalizedUserType =
    user?.userType ??
    ((typeof userRecord.user_type === "string"
      ? userRecord.user_type
      : undefined) as "student" | "professional" | undefined) ??
    (normalizedCompany ? "professional" : "student");
  const normalizedEmailVerified =
    typeof user?.emailVerified === "boolean"
      ? user.emailVerified
      : typeof userRecord.emailVerified === "boolean"
        ? userRecord.emailVerified
        : typeof userRecord.email_verified === "boolean"
          ? userRecord.email_verified
          : false;

  const normalizedName = useMemo(() => {
    const first = user?.firstName?.trim() || "";
    const last = user?.lastName?.trim() || "";
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    if (user?.name?.trim()) return user.name;
    return user?.email?.split("@")[0] || "User";
  }, [user]);

  const [profileForm, setProfileForm] = useState<UpdateUserRequest>({
    firstName: user?.firstName || user?.name?.split(" ")[0] || "",
    lastName:
      user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
    phone: user?.phone || "",
    userType: normalizedUserType,
    college: normalizedCollege,
    company: normalizedCompany,
  });

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || user?.name?.split(" ")[0] || "",
      lastName:
        user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
      phone: user?.phone || "",
      userType: normalizedUserType,
      college: normalizedCollege,
      company: normalizedCompany,
    });
  }, [user, normalizedUserType, normalizedCollege, normalizedCompany]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => usersApi.update(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setUser(response.data);
        queryClient.setQueryData(["currentUser"], response.data);
        setProfileSuccess(true);
        toast.success("Profile updated successfully");
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        toast.error(response.error || "Failed to update profile");
      }
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName: profileForm.firstName?.trim() || undefined,
      lastName: profileForm.lastName?.trim() || undefined,
      phone: isAdmin ? undefined : profileForm.phone?.trim() || undefined,
      userType: isAdmin ? user?.userType || "professional" : profileForm.userType,
      college: isAdmin
        ? undefined
        : isStudent
          ? profileForm.college?.trim() || undefined
          : undefined,
      company: isAdmin
        ? undefined
        : !isStudent
          ? profileForm.company?.trim() || undefined
          : undefined,
    });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isStudent = profileForm.userType === "student";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {!user ? (
        <CardSkeleton />
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(normalizedName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-semibold text-foreground">
                    {normalizedName}
                  </h2>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <Badge variant="secondary" className="capitalize">
                      <Shield className="mr-1 h-3 w-3" />
                      {user.role || "User"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        normalizedEmailVerified
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                      }
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {normalizedEmailVerified ? "Email Verified" : "Email Not Verified"}
                    </Badge>
                    {normalizedCollege ? (
                      <Badge variant="outline">
                        <GraduationCap className="mr-1 h-3 w-3" />
                        {normalizedCollege}
                      </Badge>
                    ) : null}
                    {normalizedCompany ? (
                      <Badge variant="outline">
                        <Building2 className="mr-1 h-3 w-3" />
                        {normalizedCompany}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-sm text-muted-foreground">Member since</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="glass-panel grid h-auto w-full grid-cols-2 rounded-xl p-1.5">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 data-[state=active]:border-border data-[state=active]:bg-background/95"
              >
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center gap-2 data-[state=active]:border-border data-[state=active]:bg-background/95"
              >
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {profileSuccess && (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Profile updated successfully
                      </div>
                    )}

                    {updateProfileMutation.isError && (
                      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        Failed to update profile. Please try again.
                      </div>
                    )}

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="firstName"
                            value={profileForm.firstName || ""}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, firstName: e.target.value })
                            }
                            className="pl-10"
                            placeholder="Enter first name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="lastName"
                            value={profileForm.lastName || ""}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, lastName: e.target.value })
                            }
                            className="pl-10"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>

                      {!isAdmin && (
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="phone"
                              type="tel"
                              value={profileForm.phone || ""}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, phone: e.target.value })
                              }
                              className="pl-10"
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Role</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={user.role || "User"}
                            disabled
                            className="pl-10 capitalize"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Contact an administrator to change your role
                        </p>
                      </div>

                      {!isAdmin && (
                        <div className="space-y-2">
                          <Label>User Type</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setProfileForm({
                                  ...profileForm,
                                  userType: "student",
                                  company: "",
                                })
                              }
                              className={cn(
                                "rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                                isStudent
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-input hover:border-primary/50"
                              )}
                            >
                              Student
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setProfileForm({
                                  ...profileForm,
                                  userType: "professional",
                                  college: "",
                                })
                              }
                              className={cn(
                                "rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                                !isStudent
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-input hover:border-primary/50"
                              )}
                            >
                              Professional
                            </button>
                          </div>
                        </div>
                      )}

                      {!isAdmin && isStudent ? (
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="college">College Name</Label>
                          <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="college"
                              value={profileForm.college || ""}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, college: e.target.value })
                              }
                              className="pl-10"
                              placeholder="Enter college name"
                            />
                          </div>
                        </div>
                      ) : !isAdmin ? (
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="company">Company Name</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="company"
                              value={profileForm.company || ""}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, company: e.target.value })
                              }
                              className="pl-10"
                              placeholder="Enter company name"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Activity</CardTitle>
                  <CardDescription>
                    Recent activity and session information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Account Created</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
