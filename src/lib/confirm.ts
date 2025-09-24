type ConfirmDetail = { 
  message: string; 
  title: string; 
  confirmText: string; 
  cancelText: string; 
  danger?: boolean;
  resolve: (v: boolean) => void 
};

export function confirmModal(
  message: string, 
  options?: { 
    title?: string; 
    confirmText?: string; 
    cancelText?: string;
    danger?: boolean;
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    const event = new CustomEvent<ConfirmDetail>("app:confirm", {
      detail: {
        message,
        title: options?.title ?? "Confirm",
        confirmText: options?.confirmText ?? "Confirm",
        cancelText: options?.cancelText ?? "Cancel",
        danger: options?.danger ?? true,
        resolve,
      },
    });
    window.dispatchEvent(event);
  });
}
