import type { ReactNode } from 'react';

/** Wrapper global — fond crème, flex vertical pleine hauteur. */
export function AppShell({ children }: { children: ReactNode }) {
  return <div className="h-screen bg-white flex flex-col overflow-hidden">{children}</div>;
}
