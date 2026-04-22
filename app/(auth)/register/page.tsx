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
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { LogoLink } from "@/components/layout/logo-link";
import { LogoMark } from "@/components/layout/logo-mark";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  userType: z.enum(["student", "professional"]),
  college: z.string().optional(),
  company: z.string().optional(),
  otp: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).superRefine((data, ctx) => {
  if (data.userType === "student" && !data.college?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "College name is required",
      path: ["college"],
    });
  }

  if (data.userType === "professional" && !data.company?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Company name is required",
      path: ["company"],
    });
  }
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: "student",
    },
  });

  const userType = watch("userType");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      if (!otpSent) {
        const otpResponse = await authApi.sendOtp(data.email.trim());

        if (!otpResponse.success) {
          toast.error(otpResponse.error || "Failed to send OTP");
          return;
        }

        setOtpSent(true);
        setIsOtpVerified(false);
        toast.success("OTP sent to your email");
        return;
      }

      if (!data.otp?.trim()) {
        setError("otp", {
          type: "manual",
          message: "Please enter the OTP sent to your email",
        });
        return;
      }

      const verifyResponse = await authApi.verifyOtp(data.email.trim(), data.otp.trim());
      const verificationResult = verifyResponse.data;
      const isExplicitFailure =
        verificationResult === false ||
        (typeof verificationResult === "object" &&
          verificationResult !== null &&
          "verified" in verificationResult &&
          verificationResult.verified === false);
      const isVerified = verifyResponse.success && !isExplicitFailure;

      if (!isVerified) {
        setIsOtpVerified(false);
        toast.error(verifyResponse.error || "OTP verification failed");
        return;
      }

      setIsOtpVerified(true);
      clearErrors("otp");

      const response = await authApi.register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone.trim(),
        userType: data.userType,
        college: data.userType === "student" ? data.college?.trim() || null : null,
        company: data.userType === "professional" ? data.company?.trim() || null : null,
        emailVerified: true,
      });

      if (response.success) {
        toast.success("Account created successfully! Please sign in.");
        router.push("/login");
      } else {
        toast.error(response.error || "Registration failed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const email = getValues("email")?.trim();

    if (!email) {
      setError("email", {
        type: "manual",
        message: "Enter your email before requesting OTP",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.sendOtp(email);
      if (response.success) {
        toast.success("OTP resent successfully");
      } else {
        toast.error(response.error || "Failed to resend OTP");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LogoLink className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <LogoMark className="h-10 w-10 rounded-lg" />
        <span className="text-xl font-semibold">Yojak AI</span>
      </LogoLink>

      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Get started with Yojak AI for free</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Asfa"
                  {...register("firstName")}
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  {...register("lastName")}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
                disabled={otpSent}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+911234567890"
                {...register("phone")}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                    userType === "student"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:border-primary/50"
                  )}
                >
                  <input
                    type="radio"
                    value="student"
                    {...register("userType")}
                    className="sr-only"
                  />
                  Student
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                    userType === "professional"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:border-primary/50"
                  )}
                >
                  <input
                    type="radio"
                    value="professional"
                    {...register("userType")}
                    className="sr-only"
                  />
                  Professional
                </label>
              </div>
            </div>

            {userType === "student" ? (
              <div className="space-y-2">
                <Label htmlFor="college">College Name</Label>
                <Input
                  id="college"
                  type="text"
                  placeholder="MIT"
                  {...register("college")}
                  className={errors.college ? "border-destructive" : ""}
                />
                {errors.college && (
                  <p className="text-sm text-destructive">{errors.college.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Acme Inc."
                  {...register("company")}
                  className={errors.company ? "border-destructive" : ""}
                />
                {errors.company && (
                  <p className="text-sm text-destructive">{errors.company.message}</p>
                )}
              </div>
            )}

            {otpSent && (
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="otp">Email OTP</Label>
                    <p className="text-xs text-muted-foreground">
                      Enter the OTP sent to {getValues("email")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </Button>
                </div>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  {...register("otp")}
                  className={errors.otp ? "border-destructive" : ""}
                />
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp.message}</p>
                )}
                {isOtpVerified && (
                  <p className="text-sm text-green-600">Email verified successfully.</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpSent ? "Verify OTP & Create account" : "Send OTP"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
