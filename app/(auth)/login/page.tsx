"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api/auth";
import { decodeJwtPayload, setAccessToken } from "@/lib/api/client";
import { usersApi } from "@/lib/api/users";
import { adminApi } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "@/components/ui/sonner";
import { LogoLink } from "@/components/layout/logo-link";
import { LogoMark } from "@/components/layout/logo-mark";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      const response = await authApi.login(data);
      const redirectPath = response.success && response.data?.role === "admin"
        ? "/admin/users"
        : "/dashboard";
      
      if (response.success && response.data) {
        // Fetch user details
        if (response.data.token) {
          setAccessToken(response.data.token);
          localStorage.setItem("accessToken", response.data.token);
        }

        const tokenClaims = decodeJwtPayload<{
          userId?: string;
          email?: string;
          role?: string;
          roles?: string[];
        }>(response.data.token);

        const fallbackRole =
          (response.data.role as "admin" | "user" | undefined) ||
          (tokenClaims?.role as "admin" | "user" | undefined) ||
          ((tokenClaims?.roles?.[0] as "admin" | "user" | undefined) ?? "user");

        const userResponse =
          fallbackRole === "admin" ? await adminApi.getMe() : await usersApi.getById();
          if (userResponse.success && userResponse.data) {
            setUser(userResponse.data);
            setIsAuthenticated(true);
            toast.success("Welcome back!");
            router.push(redirectPath);
            return;
          }

        const fallbackEmail = tokenClaims?.email || data.email;

        setUser({
          id: tokenClaims?.userId || response.data.userId || "current-user",
          email: fallbackEmail,
          name: fallbackEmail.split("@")[0],
          role: fallbackRole,
        });
        setIsAuthenticated(true);
        toast.success("Welcome back!");
        router.push(redirectPath);
      } else {
        const message = response.error || "Login failed";
        setSubmitError(message);
        toast.error(message);
      }
    } catch {
      setSubmitError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mobile Logo */}
      <LogoLink className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <LogoMark className="h-10 w-10 rounded-lg" />
        <span className="text-xl font-semibold">Yojak AI</span>
      </LogoLink>

      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
