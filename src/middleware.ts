import {defineRouting} from 'next-intl/routing';
import createMiddleware from 'next-intl/middleware';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'fr'],
 
  // Used when no locale matches
  defaultLocale: 'en'
});

export default createMiddleware(routing);
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(fr|en)/:path*']
};
