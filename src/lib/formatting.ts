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

export function kebabcase(s: string): string {
  return s
    .toString()
    .normalize("NFKD") // decompose accents
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .trim()
    // insert hyphen between camelCase boundaries
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    // unify separators to hyphen
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    // remove invalid chars
    .replace(/[^a-z0-9-]/g, "")
    // collapse multiple hyphens
    .replace(/-+/g, "-")
    // trim hyphens
    .replace(/^-+|-+$/g, "");
}

// multiple media -> Multiple Media
export function capitalize(s: string): string {
  return s
    .toString()
    .toLowerCase()
    .replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1));
}