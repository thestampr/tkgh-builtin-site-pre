"use client";

import clsx from "clsx";
import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
  className?: string;
}

interface UserAvatarProps {
  name?: string;
  src?: string;
  size?: number;
  padding?: number;
  letterIcon?: boolean;
  viewer?: boolean;
  sessionUser?: boolean;
  disableRipple?: boolean;
  debug?: boolean;
  onError?: () => void;
};

export default function UserAvatar({ 
  src,
  name,
  size = 32,
  padding = 2,
  letterIcon = true,
  sessionUser = true,
  disableRipple = false,
  debug = false,
  onError,
  ...props
}: UserAvatarProps & Props) {
  const { data: session, status } = sessionUser ? useSession() : { data: undefined, status: "unauthenticated" };
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  useEffect(() => {
    if (!sessionUser) return;
    if (!session?.user) return;
    
    if (session?.user.avatarUrl || session?.user.profile?.avatarUrl) {
      // User has an avatar, try to load it
      setImageError(false);
    } else {
      // No avatar available
      setImageError(true);
    }
  }, [session?.user]);

  const imgSrc = src ?? (sessionUser ? session?.user.avatarUrl || session?.user.profile?.avatarUrl : undefined);
  const imgAlt = name ?? (sessionUser ? session?.user.name || session?.user.profile?.displayName : undefined);
  const displayImage = !imageError && ( imgSrc || status === "authenticated" );

  return (
    <div className={
      clsx(
        "flex items-center justify-center rounded-full overflow-hidden bg-gray-100 select-none relative",
        "**:!text-gray-500",
        props.className
      )
    }
      style={{ 
        maxWidth: size, 
        maxHeight: size,
        minWidth: size, 
        minHeight: size,
        aspectRatio: 1
      }}
      data-ripple={!disableRipple && displayImage}
      onContextMenu={(e) => e.preventDefault()}
    >
      {displayImage ? (
        <Image
          src={imgSrc || "/unknown.png"}
          alt="Avatar"
          width={size}
          height={size}
          onError={handleImageError}
          className="rounded-full object-cover w-full h-full"
          style={{ padding }}
          draggable={false}
          priority
        />
      ) : letterIcon && imgAlt ?
        <span className="!no-underline" style={{ fontSize: size / 2, fontWeight: 600 }} >
          {imgAlt?.slice(0, 2).toUpperCase()}
        </span>
        : <User size={size * 2/3} opacity={.6} />
      }
    </div>
  );
}