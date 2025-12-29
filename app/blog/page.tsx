import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-[800px] px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Blog</h1>

      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="text-lg font-medium hover:underline"
            >
              {p.title}
            </Link>

            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {p.date}
              {p.tags?.length ? ` · ${p.tags.join(", ")}` : ""}
            </div>

            {p.description ? (
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                {p.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
