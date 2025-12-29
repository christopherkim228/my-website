'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === 'system' ? systemTheme : theme;
  const isDark = current === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="inline-flex items-center justify-center rounded-md
                 border border-zinc-200 dark:border-zinc-800
                 bg-white dark:bg-zinc-950
                 text-zinc-700 dark:text-zinc-200
                 hover:bg-zinc-100 dark:hover:bg-zinc-900
                 transition-colors
                 h-9 w-9"
    >
      <div className="relative h-4 w-4">
        <Sun
          className={[
            "absolute inset-0 h-4 w-4",
            "transition-all duration-300 ease-in-out",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0",
          ].join(" ")}
        />
        <Moon
          className={[
            "absolute inset-0 h-4 w-4",
            "transition-all duration-300 ease-in-out",
            isDark ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
          ].join(" ")}
        />
      </div>

    </button>
  );
}
