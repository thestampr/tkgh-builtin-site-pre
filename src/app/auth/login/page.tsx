import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AuthLoginRedirect() {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en';
  redirect(`/${locale}/login`);
}
