'use client';

import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { getGreeting } from '@/lib/utils';

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { profile } = useUser();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('intencional_profile');
    window.location.href = '/auth/login';
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-brand-bg border-b border-brand-border lg:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface transition-colors"
          aria-label="Menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <p className="text-sm font-medium text-brand-text-2">
            {getGreeting()}
            {profile?.nombre ? (
              <span
                className="font-semibold ml-1"
                style={{
                  background: 'linear-gradient(135deg, #9B6BB5, #C84B8C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {profile.nombre}
              </span>
            ) : ''}
          </p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-rose transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Salir
      </button>
    </header>
  );
}
