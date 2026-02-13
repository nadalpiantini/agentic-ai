"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");

    // Block code (has language class)
    if (match) {
      return <CodeBlock language={match[1]} code={codeString} />;
    }

    // Multi-line code without language = block code
    if (codeString.includes("\n")) {
      return <CodeBlock code={codeString} />;
    }

    // Inline code
    return (
      <code className="rounded bg-zinc-700/70 px-1.5 py-0.5 text-[13px] font-mono text-zinc-200">
        {children}
      </code>
    );
  },
  pre({ children }) {
    // If children is already a CodeBlock, pass through
    return <>{children}</>;
  },
  p({ children }) {
    return <p className="mb-3 last:mb-0">{children}</p>;
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 underline decoration-blue-400/30 hover:decoration-blue-400 transition-colors"
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="mb-3 list-disc pl-6 last:mb-0">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mb-3 list-decimal pl-6 last:mb-0">{children}</ol>;
  },
  li({ children }) {
    return <li className="mb-1">{children}</li>;
  },
  h1({ children }) {
    return (
      <h1 className="mb-3 mt-4 text-lg font-bold first:mt-0">{children}</h1>
    );
  },
  h2({ children }) {
    return (
      <h2 className="mb-2 mt-3 text-base font-semibold first:mt-0">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="mb-2 mt-3 text-sm font-semibold first:mt-0">
        {children}
      </h3>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="mb-3 border-l-2 border-zinc-600 pl-3 text-zinc-400 last:mb-0">
        {children}
      </blockquote>
    );
  },
  table({ children }) {
    return (
      <div className="mb-3 overflow-x-auto last:mb-0">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-left text-xs font-medium text-zinc-300">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border border-zinc-700 px-3 py-1.5 text-zinc-300">
        {children}
      </td>
    );
  },
  hr() {
    return <hr className="my-4 border-zinc-700" />;
  },
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
