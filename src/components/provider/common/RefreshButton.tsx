"use client";

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
  const text = running ? refreshingLabel : (cooldown > 0 ? `${label} (${cooldown})` : label);

  return (
    <button
      onClick={handleClick}
      className={`btn btn-ghost inline-flex items-center gap-2 ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
      disabled={disabled}
      title={text}
      aria-busy={running}
    >
      { running 
        ? <Loader2 size={14} className="animate-spin" />
        : <RotateCw size={14} />
      }
      {text}
    </button>
  );
};
