import Link from "next/link";
import { getAllTags } from "@/lib/posts";

export default function TagsIndexPage() {
  const tags = getAllTags();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Tags</h1>

      <ul className="mt-6 flex flex-wrap gap-2">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              className="rounded-full border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              href={`/tags/${encodeURIComponent(tag)}`}
            >
              {tag} <span className="opacity-60">({count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
