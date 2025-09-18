import type { Session } from 'next-auth';

export function assertProvider(session: Session | null) {
  if (!session || session.user?.role !== 'PROVIDER') {
    throw new Error('FORBIDDEN');
  }
}