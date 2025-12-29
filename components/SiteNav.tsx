'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

const items = [
  { href: '/progress', label: 'Progress' },
  { href: '/tags', label: 'Tags' },
  { href: '/blog', label: 'Blog' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      className="w-full border-b
                bg-white/80 dark:bg-zinc-900/80
                border-zinc-200 dark:border-zinc-800
                text-zinc-900 dark:text-zinc-100"
    >


      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-2">
        <Link href="/" className="mr-3 font-semibold">
          My Website
        </Link>

        <div className="flex items-center gap-1">
          {items.map((it) => {
            const active = isActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={[
                  'px-3 py-1.5 rounded-md text-sm',
                  active
                    ? 'bg-zinc-100 dark:bg-zinc-800 font-medium'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                ].join(' ')}
              >
                {it.label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        <ThemeToggle />
      </div>
    </nav>
  );
}
