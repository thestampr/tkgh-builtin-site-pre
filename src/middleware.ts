import createMiddleware from "next-intl/middleware";
import { routing } from '@/i18n/routing';
 
export default createMiddleware(routing);

export const config = {
  // Skip next internals and api routes
  matcher: [
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
  ]
};