'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard', label: 'Dashboard',
    icon: (
      <svg width="16" height="16" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/visita', label: 'Visita del día',
    icon: (
      <svg width="16" height="16" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/clientes', label: 'Clientes',
    icon: (
      <svg width="16" height="16" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/rutas', label: 'Rutas',
    icon: (
      <svg width="16" height="16" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    href: '/stock', label: 'Stock',
    icon: (
      <svg width="16" height="16" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/avisos', label: 'Avisos',
    icon: (
      <svg width="16" height="16" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    href: '/remitos', label: 'Remitos',
    icon: (
      <svg width="16" height="16" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

function LogoSymbol() {
  return (
    <svg width="32" height="37" viewBox="0 0 50 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgSide" x1="45" y1="2" x2="1" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C07DD4" />
          <stop offset="45%" stopColor="#D055A8" />
          <stop offset="100%" stopColor="#D84E86" />
        </linearGradient>
      </defs>
      {/* Pétalo inferior-izquierdo (grande, magenta) */}
      <path d="M37 32 C42 42 7 55 4 50 C1 45 32 22 37 32Z"
        fill="url(#lgSide)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Pétalo superior-izquierdo (violeta oscuro) */}
      <path d="M37 32 C33 37 0 6 1 3 C3 0 41 27 37 32Z"
        fill="url(#lgSide)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Pétalo superior-centro (violeta-rosa) */}
      <path d="M37 32 C32 35 19 3 22 2 C25 1 42 29 37 32Z"
        fill="url(#lgSide)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Pétalo superior-derecho (fino, rosa claro) */}
      <path d="M37 32 C40 33 45 4 43 4 C41 4 33 31 37 32Z"
        fill="url(#lgSide)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full bg-brand-surface border-r border-brand-border">
      {/* Logo */}
      <Link
        href="/dashboard"
        onClick={onClose}
        className="flex items-center gap-3 px-5 py-5 border-b border-brand-border hover:bg-brand-subtle/60 transition-colors"
      >
        <LogoSymbol />
        <h1
          className="font-display font-bold tracking-wider leading-none text-base"
          style={{
            background: 'linear-gradient(135deg, #C07DD4, #D84E86)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: "'Raleway', sans-serif",
            letterSpacing: '0.12em',
          }}
        >
          INTENCIONAL
        </h1>
      </Link>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-subtle text-brand-rose shadow-sm'
                  : 'text-brand-muted hover:text-brand-text hover:bg-white hover:shadow-sm'
              )}
            >
              <span
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-brand-rose' : 'text-brand-muted'
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-brand-border">
        <p className="text-[10px] text-brand-muted text-center tracking-wider">
          Sistema de gestión
        </p>
      </div>
    </aside>
  );
}
