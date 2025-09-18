import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';
 
// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);

// Keep locales in one place so components can import from "@/navigation".
export const locales = (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || "en,th").split(",");
export const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";