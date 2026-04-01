'use client';

import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getGreeting } from '@/lib/utils';

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { profile } = useUser();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('intencional_profile');
    window.location.href = '/auth/login';
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-brand-dark border-b border-brand-border lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-brand-muted hover:text-brand-white"
          aria-label="Menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <p className="text-sm text-brand-muted">
            {getGreeting()}{profile?.nombre ? `, ${profile.nombre}` : ''}
          </p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="text-sm text-brand-muted hover:text-brand-white transition-colors"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
