'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import type { User } from '@supabase/supabase-js';
import React from 'react';

interface UserContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

function getCachedProfile(): Profile | null {
  try {
    const cached = localStorage.getItem('intencional_profile');
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

function setCachedProfile(profile: Profile | null) {
  try {
    if (profile) {
      localStorage.setItem('intencional_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('intencional_profile');
    }
  } catch { }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  // Cargar perfil cacheado inmediatamente — sin esperar network
  const [profile, setProfile] = useState<Profile | null>(getCachedProfile);
  const [loading, setLoading] = useState(() => !getCachedProfile());
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          if (data) {
            setProfile(data);
            setCachedProfile(data);
          }
        } else if (!pathname.startsWith('/auth')) {
          setCachedProfile(null);
          router.replace('/auth/login');
        }
      } catch (err) {
        console.error('UserProvider error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (data) {
            setProfile(data);
            setCachedProfile(data);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setCachedProfile(null);
          setLoading(false);
          router.replace('/auth/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return React.createElement(
    UserContext.Provider,
    { value: { user, profile, loading, signOut } },
    children
  );
}

export function useUser() {
  return useContext(UserContext);
}
