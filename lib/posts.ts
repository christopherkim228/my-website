import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((t): t is string => typeof t === "string");
  }
  if (typeof tags === "string") {
    // allow tags: "notes, setup" or "notes"
    return tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

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

  const fm = data as PostFrontmatter;
  
  return {
    frontmatter: {
      ...fm,
      tags: normalizeTags(fm.tags),
    },
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

export type TagSummary = {
  tag: string;
  count: number;
};

export function getAllTags(): TagSummary[] {
  const posts = getAllPosts();
  const counts = new Map<string, number>();

  for (const p of posts) {
    for (const t of p.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => (a.tag < b.tag ? -1 : 1));
}

export function getPostsByTag(tag: string) {
  return getAllPosts().filter((p) => (p.tags ?? []).includes(tag));
}
