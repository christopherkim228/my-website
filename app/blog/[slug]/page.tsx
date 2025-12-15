import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostSlugs, getPostSource } from "@/lib/posts";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { extractToc } from "@/lib/toc";


const prettyCodeOptions = {
  theme: "material-theme-darker",
  keepBackground: false,
};

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

  const toc = extractToc(content);

  const tags = frontmatter.tags ?? [];

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>{frontmatter.title}</h1>
      <div className="mt-2 text-sm opacity-70">
        {frontmatter.date}
        {tags?.length ? (
          <>
            {" · "}
            {tags.map((t, i) => (
              <span key={t}>
                <a className="hover:underline" href={`/tags/${encodeURIComponent(t)}`}>
                  {t}
                </a>
                {i < tags.length - 1 ? ", " : ""}
              </span>
            ))}
          </>
        ) : null}
      </div>

      <div className="mb-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100 hover:underline"
        >
          ← Back to Blog
        </Link>
      </div>

      {toc.length > 0 && (
        <nav style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1rem", opacity: 0.7 }}>Contents</h2>
          <ul>
            {toc.map((item, i) => (
              <li key={`${item.id}-${i}`} style={{ marginLeft: (item.depth - 2) * 16 }}>
                <a href={`#${item.id}`}>{item.value}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <article className="prose prose-neutral max-w-none dark:prose-invert
        prose-pre:rounded-xl prose-pre:p-4
        prose-code:before:content-none prose-code:after:content-none">
        <MDXRemote
          source={content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkMath],
              rehypePlugins: [
                rehypeKatex,
                [rehypePrettyCode, prettyCodeOptions],
                rehypeSlug,
                [
                  rehypeAutolinkHeadings,
                  {
                    behavior: "append",
                    content: {
                      type: "text",
                      value: "#",
                    },
                    properties: {
                      className: ["heading-anchor"],
                      ariaLabel: "Link to section",
                    },
                  },
                ],
              ],
            },
          }}
        />
      </article>
      <div className="mt-12 border-t pt-6">
        <Link
          href="/blog"
          className="text-sm opacity-70 hover:opacity-100 hover:underline"
        >
          ← Back to Blog
        </Link>
      </div>
    </main>
  );
}
