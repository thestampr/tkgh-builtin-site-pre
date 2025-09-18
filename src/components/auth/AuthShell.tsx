"use client";
import { ReactNode } from 'react';
import clsx from 'clsx';

interface AuthShellProps {
  title: string;
  subtitle?: string | null;
  children: ReactNode;
  footer?: ReactNode;
  tone?: 'default' | 'provider' | 'register';
}

// Central white-gold luxury gradient + subtle pattern
export function AuthShell({ title, subtitle, children, footer, tone = 'default' }: AuthShellProps) {
  const gradient = tone === 'provider'
    ? 'from-white via-[#fefdfc] to-[#faf8f4]'
    : tone === 'register'
      ? 'from-white via-[#ffffff] to-[#fbf9f5]'
      : 'from-white via-[#fefefe] to-[#fbfaf7]';

  return (
    <div className={clsx('relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-16 px-4 overflow-hidden')}>      
      <div className={clsx('absolute inset-0 -z-10 bg-gradient-to-br', gradient)} />
      {/* Gold noise / vignette overlays */}
  <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16] [background:radial-gradient(circle_at_28%_22%,rgba(206,174,120,0.18),transparent_60%),radial-gradient(circle_at_74%_76%,rgba(190,160,115,0.12),transparent_55%)]" />
  <div className="pointer-events-none absolute inset-0 -z-10 mix-blend-overlay opacity-20 [background:linear-gradient(to_bottom_right,rgba(205,175,125,0.07),rgba(170,140,95,0.02))]" />

      <div className="w-full max-w-md">
  <div className="rounded-2xl shadow-[0_4px_22px_-8px_rgba(0,0,0,0.08)] ring-1 ring-[#eadfcc]/50 bg-gradient-to-br from-white/98 via-white/95 to-white/90 backdrop-blur-xl p-10 relative">
          <div className="absolute inset-0 rounded-2xl pointer-events-none [background:linear-gradient(140deg,rgba(255,255,255,0.6),rgba(255,255,255,0.05))]" />
          <div className="absolute -top-px -left-px w-[calc(100%+2px)] h-[calc(100%+2px)] rounded-2xl pointer-events-none [background:linear-gradient(175deg,#f3ede3,#e5d6c0,#ddc7a4,#e5d6c0,#f3ede3)] opacity-[0.14]" />
          <div className="relative mb-8 text-center space-y-3">
            <h1 className="text-2xl font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-[#8a6a40] via-[#a4814f] to-[#8a6a40] [filter:brightness(1.02)]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[#7b6342]/70 font-light max-w-xs mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div className="relative space-y-6">
            {children}
          </div>
          {footer && (
      <div className="mt-10 pt-6 border-t border-[#efe5d5] text-[11px] text-center text-[#7b6342]/70 space-y-2">
              {footer}
            </div>
          )}
        </div>
    <div className="mt-8 text-center text-[10px] tracking-wide text-[#846c49]/50">
          © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_BRAND_NAME || 'Brand'}
        </div>
      </div>
    </div>
  );
}
