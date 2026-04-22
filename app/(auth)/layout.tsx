import { LogoLink } from "@/components/layout/logo-link";
import { LogoMark } from "@/components/layout/logo-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between bg-primary p-10">
        <LogoLink className="flex items-center gap-3">
          <LogoMark className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-semibold text-primary-foreground">
            Yojak AI
          </span>
        </LogoLink>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight text-balance">
            AI-Powered Construction Project Management
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Streamline your construction projects with intelligent planning,
            task automation, and real-time collaboration.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Trusted by construction teams worldwide
        </p>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
