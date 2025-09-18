export function formatPrice(value: number | null | undefined, locale?: string, currency?: string | null) {
  if (typeof value !== "number") return "";
  currency ??= locale?.startsWith("th") ? "THB" : "USD";
  try {
    return new Intl.NumberFormat(locale || process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en", {
      style: "currency",
      currency,
      currencyDisplay: 'code',
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}