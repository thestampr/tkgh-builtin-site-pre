"use client";

import clsx from "clsx";
import { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle?: string | null;
  children: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "provider" | "register";
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  tone = "default",
}: AuthShellProps) {
  // Mapping glow position ตาม tone
  const glowPosition: Record<
    NonNullable<AuthShellProps["tone"]>,
    string
  > = {
    default: "ellipse at center",
    provider: "ellipse at top left",
    register: "ellipse at bottom right",
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-16 px-4 overflow-hidden">
      {/* Gold glow background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(${glowPosition[tone]}, rgba(138,106,64,0.24) 0%, transparent 60%)`,
          filter: "blur(80px)",
        }}
      />

      <div className="w-full max-w-md">
        <div className="rounded-2xl ring-1 ring-primary/10 bg-white p-10 relative shadow-xl shadow-[#d4af37]/5">
          <div className="relative mb-8 text-center space-y-3">
            <h1 className={clsx(
              "text-2xl font-semibold tracking-wide bg-clip-text text-transparent",
              "bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40] [filter:brightness(1.02)]"
            )}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[#7b6342]/70 font-light max-w-xs mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="relative space-y-6">{children}</div>

          {footer && (
            <div className="mt-10 pt-6 border-t border-[#efe5d5] text-[11px] text-center text-[#7b6342]/70 space-y-2">
              {footer}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-[10px] tracking-wide text-[#846c49]/50">
          © {new Date().getFullYear()}{" "}
          {process.env.NEXT_PUBLIC_BRAND_NAME || "Brand"}
        </div>
      </div>
    </div>
  );
}
