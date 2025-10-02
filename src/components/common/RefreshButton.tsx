"use client";

import clsx from "clsx";
import { Loader2, RotateCw } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const DEFAULT_COOLDOWN_MS = 10000;

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  cooldownMs?: number; // default 10s
  label?: string;
  refreshingLabel?: string;
  className?: string;
  initialCooldownMS?: number; // in seconds
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  label = "Refresh",
  refreshingLabel = "Refreshing...",
  className = "",
  initialCooldownMS = DEFAULT_COOLDOWN_MS
}) => {
  const [cooldown, setCooldown] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [initialDisabled, setInitialDisabled] = useState<boolean>(!!initialCooldownMS);
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
    if (initialCooldownMS > 0) {
      setCooldown(Math.floor(initialCooldownMS / 1000));
      setInitialDisabled(false);
    }
  }, [initialCooldownMS]);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setInitialDisabled(false);
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
      disabled={disabled || initialDisabled}
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
          disabled || initialDisabled ? "opacity-100" : "opacity-0",
        )}
        style={coolingdown
          ? { 
            transition: `transform ${cooldownMs}ms linear`, 
            transform: "translateX(100%)"
          } : { 
            transition: `none`
          }}
      />
    </button>
  );
};
