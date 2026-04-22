"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  imageClassName?: string;
}

export function LogoMark({ className, imageClassName }: LogoMarkProps) {
  return (
    <div className={cn("soft-glow relative overflow-hidden rounded-xl", className)}>
      <Image
        src="/logo.png"
        alt="Yojak AI logo"
        fill
        sizes="40px"
        className={cn("object-cover", imageClassName)}
        priority
      />
    </div>
  );
}
