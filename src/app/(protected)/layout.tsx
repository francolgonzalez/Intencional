'use client';

import { AppShell } from '@/components/layout/AppShell';
import { UserProvider } from '@/hooks/useUser';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
