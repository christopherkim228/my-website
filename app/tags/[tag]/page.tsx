import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/lib/posts";

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}


export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

  const posts = getPostsByTag(decoded);
  if (posts.length === 0) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Tag: {decoded}</h1>

      <ul className="mt-6 space-y-4">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link className="text-lg font-semibold hover:underline" href={`/blog/${p.slug}`}>
              {p.title}
            </Link>
            <div className="text-sm opacity-70">{p.date}</div>
            {p.description ? <p className="mt-1 opacity-90">{p.description}</p> : null}
          </li>
        ))}
      </ul>
      
      <div className="mt-10">
        <Link className="text-sm opacity-70 hover:underline" href="/tags">
          ← All tags
        </Link>
      </div>
    </main>
  );
}
