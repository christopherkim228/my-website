import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";
import type { Root, Heading, Text, InlineCode, Parent } from "mdast";
import type { Node } from "unist";
import GithubSlugger from "github-slugger";

export type TocItem = {
  depth: number;
  value: string;
  id: string;
};

function extractText(node: Node): string {
  switch (node.type) {
    case "text":
      return (node as Text).value;

    case "inlineCode":
      return (node as InlineCode).value;

    default:
      if (isParent(node)) {
        return node.children.map(extractText).join("");
      }
      return "";
  }
}

function isParent(node: Node): node is Parent {
  return Array.isArray((node as Parent).children);
}

export function extractToc(source: string): TocItem[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkMath) 
    .use(remarkMdx)
    .parse(source) as Root;

  const toc: TocItem[] = [];
  const slugger = new GithubSlugger();

  visit(tree, "heading", (node: Heading) => {
    if (node.depth < 2 || node.depth > 4) return;

    const text = extractText(node).trim();
    if (!text) return;

    toc.push({
      depth: node.depth,
      value: text,
      id: slugger.slug(text),
    });
  });

  return toc;
}
