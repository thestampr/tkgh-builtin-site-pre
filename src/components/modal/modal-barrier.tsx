import clsx from 'clsx';
import * as React from 'react';

interface Props {
  className?: string
  show: boolean
  theme?: "light" | "dark" | "auto"
  zIndex?: number
  barrierDismissible?: boolean
  closeTrigger?: () => void
}

const ModalBarrier: React.FunctionComponent<Props & React.HTMLProps<HTMLDivElement>> = ({
  className,
  show,
  theme,
  zIndex = 60,
  barrierDismissible = true,
  closeTrigger,
  ...props
}) => {
  const dataTheme = theme === "auto" ? "" : theme;

  function handleEvents(e: React.UIEvent) {
    // Close only when clicking the barrier itself (not children) and when allowed
    if (e.target === e.currentTarget) {
      if (barrierDismissible) {
        closeTrigger && closeTrigger();
      }
      e.stopPropagation();
    }
  }
  
  return (
    <div 
      data-theme={dataTheme}
      className={clsx(
        className,
        "fixed h-screen w-screen inset-0 transition-colors duration-300",
        show ? "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xs" : "bg-transparent pointer-events-none"
      )}
      style={{ zIndex }}
      onClick={handleEvents}
      onScroll={handleEvents}
      onWheel={handleEvents}
      onTouchStart={handleEvents}
      onTouchMove={handleEvents}
      {...props}
    />
  );
}

export default ModalBarrier; 