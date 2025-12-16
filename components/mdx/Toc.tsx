"use client";

import { useEffect, useMemo, useState } from "react";

export type TocItem = {
  depth: number;
  value: string;
  id: string;
};

export default function Toc({ items }: { items: TocItem[] }) {
  const ids = useMemo(() => items.map((x) => x.id), [items]);
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    if (ids.length === 0) return;

    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (els.length === 0) return;

    // Pick the heading that's currently near the top of viewport
    const obs = new IntersectionObserver(
      (entries) => {
        // entries can fire in any order; choose the top-most visible
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;

        visible.sort(
          (a, b) =>
            (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop
        );

        setActiveId((visible[0].target as HTMLElement).id);
      },
      {
        root: null,
        // Trigger when heading is in the top-ish region
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0, 1],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);

  if (items.length === 0) return null;

  return (
    <nav className="text-sm">
      <div className="mb-2 font-semibold opacity-70">Contents</div>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const indent =
            item.depth === 3 ? "ml-4" : item.depth === 4 ? "ml-8" : "ml-0";

          return (
            <li key={item.id} className={indent}>
              <a
                href={`#${item.id}`}
                className={[
                  "block rounded px-2 py-1",
                  "hover:bg-black/5 dark:hover:bg-white/10",
                  isActive ? "bg-black/5 dark:bg-white/10 font-semibold" : "opacity-80",
                ].join(" ")}
                onClick={() => setActiveId(item.id)}
              >
                {item.value}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
