import { notFound } from "next/navigation";
import { getPostSlugs, getPostSource } from "@/lib/posts";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { MDXRemote } from "next-mdx-remote/rsc";

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = getPostSource(slug);
  } catch {
    notFound();
  }

  const { frontmatter, content } = post;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>{frontmatter.title}</h1>
      <div style={{ opacity: 0.7, marginBottom: "1.5rem" }}>
        {frontmatter.date}
        {frontmatter.tags?.length ? ` · ${frontmatter.tags.join(", ")}` : ""}
      </div>

      <article>
        <MDXRemote
          source={content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkMath],
              rehypePlugins: [rehypeKatex],
            },
          }}
        />
      </article>
    </main>
  );
}
