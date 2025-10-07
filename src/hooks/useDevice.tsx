"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface DeviceContextProps {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent?: string;
}

const DeviceContext = createContext<DeviceContextProps | undefined>(undefined);

function detectDevice(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) {
    return "mobile";
  }
  if (/ipad|tablet|kindle|playbook/.test(ua)) {
    return "tablet";
  }
  return "desktop";
}

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [userAgent, setUserAgent] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.navigator) {
      const ua = window.navigator.userAgent;
      setUserAgent(ua);
      setDeviceType(detectDevice(ua));
    }
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        deviceType,
        isMobile: deviceType === "mobile",
        isTablet: deviceType === "tablet",
        isDesktop: deviceType === "desktop",
        userAgent,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
}