'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/progress', label: 'Progress' },
  { href: '/tags', label: 'Tags' },
  { href: '/blog', label: 'Blog' },
];

function isActive(pathname: string, href: string) {
  // exact match or "under" that section (e.g. /blog/post-1)
  return pathname === href || pathname.startsWith(href + '/');
}

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b bg-background/80 backdrop-blur">
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
                  'px-3 py-1.5 rounded-md text-sm transition',
                  active
                    ? 'bg-foreground text-background'
                    : 'hover:bg-muted',
                ].join(' ')}
              >
                {it.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
