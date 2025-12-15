import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import type { Root, Heading, Content } from "mdast";
import type { Node } from "unist";
import "server-only";

export type TocItem = {
  depth: number;
  value: string;
  id: string;
};

function extractText(node: Node): string {
  // mdast text node
  if ("value" in node && typeof node.value === "string") {
    return node.value;
  }

  // recurse through children
  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map(extractText).join("");
  }

  return "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function extractToc(source: string): TocItem[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .parse(source) as Root;

  const toc: TocItem[] = [];

  visit(tree, "heading", (node: Heading) => {
    if (node.depth < 2 || node.depth > 4) return;

    const text = extractText(node);
    if (!text) return;

    toc.push({
      depth: node.depth,
      value: text,
      id: slugify(text),
    });
  });

  return toc;
}