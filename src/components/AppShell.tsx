import type { ReactNode } from 'react';

/** Wrapper global — fond crème, flex vertical pleine hauteur. */
export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-cream flex flex-col">{children}</div>;
}
