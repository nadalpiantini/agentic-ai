"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { CopyButton } from "@/components/ui/copy-button";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    codeToHtml(code, {
      lang: language || "text",
      theme: "github-dark-default",
    })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        // Fallback: if language isn't supported, render as plain text
        if (!cancelled) setHtml("");
      });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  return (
    <div className="group/code my-2 overflow-hidden rounded-lg border border-zinc-700/50">
      <div className="flex items-center justify-between bg-zinc-800/80 px-3 py-1.5">
        <span className="text-[11px] font-medium text-zinc-400">
          {language || "text"}
        </span>
        <CopyButton text={code} />
      </div>
      {html ? (
        <div
          className="overflow-x-auto p-3 text-sm [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!text-[13px] [&_code]:!leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3">
          <code className="text-[13px] leading-relaxed text-zinc-300">
            {code}
          </code>
        </pre>
      )}
    </div>
  );
}
