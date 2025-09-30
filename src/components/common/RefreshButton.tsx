"use client";

import clsx from "clsx";
import { Loader2, RotateCw } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  cooldownMs?: number; // default 10s
  label?: string;
  refreshingLabel?: string;
  className?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  cooldownMs = 10000,
  label = "Refresh",
  refreshingLabel = "Refreshing...",
  className = "",
}) => {
  const [cooldown, setCooldown] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleClick() {
    if (running || cooldown > 0) return;
    setRunning(true);
    try {
      await onRefresh();
    } finally {
      setRunning(false);
      setCooldown(Math.floor(cooldownMs / 1000));
    }
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const disabled = running || cooldown > 0;
  const coolingdown = !running && disabled;
  const text = running ? refreshingLabel : label;
  const title = running ? refreshingLabel : (cooldown > 0 ? `Please wait ${cooldown}s` : label);

  return (
    <button
      onClick={handleClick}
      className={clsx(
        "btn btn-ghost inline-flex items-center gap-2 relative overflow-hidden",
        className
      )}
      disabled={disabled}
      title={title}
      aria-busy={running}
    >
      { running 
        ? <Loader2 size={14} className="animate-spin" />
        : <RotateCw size={14} />
      }
      {text}
      <span
        className={clsx(
          "bg-black/15 absolute inset-0 pointer-events-none",
          coolingdown ? "opacity-100" : "opacity-0",
        )}
        style={{ transition: `transform ${cooldownMs}ms linear`, transform: coolingdown ? "translateX(100%)" : "translateX(0)" }}
      />
    </button>
  );
};
