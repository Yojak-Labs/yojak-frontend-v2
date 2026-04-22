"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";

interface LogoLinkProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function LogoLink({ children, className, onClick }: LogoLinkProps) {
  const { isAuthenticated } = useAuthStore();
  const href = isAuthenticated ? "/dashboard" : "/";

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
