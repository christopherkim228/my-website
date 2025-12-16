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
import Theorem from "@/components/mdx/Theorem";
import Proof from "@/components/mdx/Proof";
import Toc from "@/components/mdx/Toc";



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
    <main className="mx-auto max-w-6xl px-4 py-10" style={{ margin: "0 auto", padding: "2rem 1rem" }}>
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight leading-tight">
          {frontmatter.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-70">
          <time>{frontmatter.date}</time>

          {tags.length > 0 && (
            <>
              <span>·</span>
              {tags.map((t) => (
                <a
                  key={t}
                  href={`/tags/${encodeURIComponent(t)}`}
                  className="hover:underline"
                >
                  {t}
                </a>
              ))}
            </>
          )}
        </div>
      </header>

      <div className="mb-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100 hover:underline"
        >
          ← Back to Blog
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* TOC desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <Toc items={toc} />
          </div>
        </aside>

        <div>
          {/* TOC mobile */}
          <div className="lg:hidden">
            <details className="mb-8 rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <summary className="cursor-pointer select-none text-sm font-semibold">
                Contents
              </summary>
              <div className="mt-3">
                <Toc items={toc} />
              </div>
            </details>
          </div>
          <article className="prose  pprose-neutral max-w-none dark:prose-invert
            prose-pre:rounded-xl prose-pre:p-4
            prose-code:before:content-none prose-code:after:content-none">
            <MDXRemote
              source={content}
              components={{ Theorem, Proof }}
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
        </div>
      </div>
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
