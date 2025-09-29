"use client";

import clsx from "clsx";
import * as Lucide from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export type CTAConfig = {
  label: string;
  color: string;
  textColor: string;
  size: string;
  icon: string;
  href: string;
  style: string;
  radius: string;
};

export const defaultCta: CTAConfig = {
  label: "Example",
  color: "#8a6a40",
  textColor: "#ffffff",
  size: "md",
  icon: "MessageCircle",
  href: "#",
  style: "solid",
  radius: "full"
};

interface ProviderCTAProps {
  preview?: boolean;
  config: CTAConfig | null;
}

export function ProviderCTA({ preview, config }: ProviderCTAProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (preview) return; // don't hide global CTA in preview mode
    // Hide global site CTA (ContactUsButton) while provider CTA is present
    const el = document.querySelector<HTMLElement>("[data-global-cta]");
    if (el) el.style.display = "none";
    return () => { if (el) el.style.display = ""; };
  }, []);

  if (!mounted) return null;
  if (!config) return null;

  const { 
    label = "Example", 
    color = "#8a6a40", 
    textColor = "#ffffff",
    size = "md", 
    icon = "MessageCircle", 
    style = "solid", 
    href = "#", 
    radius = "full" 
  } = config;

  const pad = size === "lg" ? "0.95rem 1.4rem" : size === "sm" ? "0.5rem 0.9rem" : "0.7rem 1.1rem";
  const iconDim = size === "lg" ? 56 : size === "sm" ? 40 : 48; // square when icon-only
  const base = style === "solid"
    ? { background: color, color: textColor, border: "none" }
    : style === "outline"
      ? { background: "rgba(255,255,255,0.85)", color: textColor, border: `1px solid ${color}` }
      : { background: "transparent", color: textColor, border: "none" };

  const radiusCls = radius === "full"
    ? "rounded-full"
    : radius === "lg"
      ? "rounded-xl"
      : radius === "md"
        ? "rounded-md"
        : "rounded-sm";

  // If neither icon nor label => don't render (allow global site CTA to show)
  if (!icon && !label) return null;

  const Icon = () => {
    if (!icon) return null;
    const I = (Lucide as any)[icon];
    return I ? <I size={size === "lg" ? 24 : size === "sm" ? 18 : 20} /> : null;
  };

  const CTA = () => <Link
    href={href}
    aria-label={label || icon || "CTA"}
    style={label ? { ...base, padding: pad } : { ...base, width: iconDim, height: iconDim, padding: 0 }}
    className={clsx(
      "shadow-lg backdrop-blur-sm font-medium inline-flex items-center justify-center select-none",
      "hover:opacity-90 transition",
      radiusCls,
      label ? "gap-2 px-0 text-sm" : "",
      preview ? "pointer-events-none" : "translate-y-[-20px]"
    )}
  >
    <Icon />
    {label && <span>{label}</span>}
  </Link>;

  if (preview) return <CTA />;

  return (
    <span className="sticky h-0 bottom-0 z-1 right-5 float-right flex ml-auto items-end overflow-visible">
      {/* This wrapper will make sticky element take no space */}
      <CTA />
    </span>
  );
}
