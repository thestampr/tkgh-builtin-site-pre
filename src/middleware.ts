import { routing } from '@/i18n/routing';
import createMiddleware from "next-intl/middleware";
 
export default createMiddleware(routing);

export const config = {
  // Skip next internals and api routes
  matcher: [
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
  ]
};