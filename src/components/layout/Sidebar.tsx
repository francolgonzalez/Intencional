'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/visita', label: 'Visita del día', icon: '🚗' },
  { href: '/clientes', label: 'Clientes', icon: '👥' },
  { href: '/rutas', label: 'Rutas', icon: '🗺️' },
  { href: '/stock', label: 'Stock', icon: '📦' },
  { href: '/avisos', label: 'Avisos', icon: '💬' },
  { href: '/remitos', label: 'Remitos', icon: '📄' },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full bg-brand-dark border-r border-brand-border">
      <Link href="/dashboard" onClick={onClose} className="block p-6 border-b border-brand-border hover:bg-brand-card/50 transition-colors">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-brand-rose">Intencional</span>
        </h1>
        <p className="text-xs text-brand-muted mt-1">Sistema de gestión</p>
      </Link>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-brand-rose/10 text-brand-rose'
                  : 'text-brand-muted hover:text-brand-white hover:bg-brand-card'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
