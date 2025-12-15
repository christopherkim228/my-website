import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostFrontmatter = {
  title: string;
  date: string; // ISO string like "2025-12-15"
  tags?: string[];
  description?: string;
};

export type PostSummary = PostFrontmatter & {
  slug: string;
};

export function getPostSlugs(): string[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getPostSource(slug: string): { frontmatter: PostFrontmatter; content: string } {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  return {
    frontmatter: data as PostFrontmatter,
    content,
  };
}

export function getAllPosts(): PostSummary[] {
  const slugs = getPostSlugs();
  const posts = slugs.map((slug) => {
    const { frontmatter } = getPostSource(slug);
    return { slug, ...frontmatter };
  });

  // newest first (string dates like YYYY-MM-DD sort correctly)
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}