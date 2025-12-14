import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Blog</h1>
      <ul>
        {posts.map((p) => (
          <li key={p.slug} style={{ margin: "1rem 0" }}>
            <Link href={`/blog/${p.slug}`}>{p.title}</Link>
            <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>
              {p.date}
              {p.tags?.length ? ` · ${p.tags.join(", ")}` : ""}
            </div>
            {p.description ? <p style={{ marginTop: "0.25rem" }}>{p.description}</p> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
