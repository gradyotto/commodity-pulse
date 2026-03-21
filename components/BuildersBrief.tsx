"use client";

import { useState, useCallback } from "react";
import type { CommodityData, ShippingIndicator } from "@/types";

interface Props {
  commodities: CommodityData[];
  shipping: ShippingIndicator[];
}

// Minimal Markdown renderer — handles our subset: ## headers, ** bold, - bullets
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const k = key++;

    if (line.startsWith("## ")) {
      const content = line.slice(3);
      elements.push(
        <h3 key={k} className="text-base font-semibold text-brand mt-6 mb-2 first:mt-0 flex items-center gap-2">
          {content}
        </h3>
      );
      continue;
    }

    if (line.startsWith("---")) {
      elements.push(<hr key={k} className="border-surface-border my-4" />);
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = parseInline(line.slice(2));
      elements.push(
        <li key={k} className="text-slate-300 text-sm leading-relaxed ml-4 list-disc">
          {content}
        </li>
      );
      continue;
    }

    if (line.trim() === "") {
      elements.push(<div key={k} className="h-1" />);
      continue;
    }

    elements.push(
      <p key={k} className="text-slate-300 text-sm leading-relaxed">
        {parseInline(line)}
      </p>
    );
  }

  return elements;
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(<strong key={i++} className="text-slate-100 font-semibold">{match[1]}</strong>);
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export function BuildersBrief({ commodities, shipping }: Props) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyBrief = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* unsupported */ }
  }, [content]);

  const generate = useCallback(async () => {
    setStatus("loading");
    setContent("");
    setError(null);

    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commodities, shipping }),
      });
      const fromCache = res.headers.get("X-Cache") === "HIT";

      if (!res.ok || !res.body) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }

      setGeneratedAt(res.headers.get("X-Generated-At") ?? new Date().toISOString());
      setFromCache(fromCache);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStatus("error");
    }
  }, [commodities, shipping]);

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Tiber Brief — AI Analysis
        </h2>
        <button
          onClick={generate}
          disabled={status === "loading"}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            bg-brand text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <>
              <span className="inline-block h-3.5 w-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm1 10H7V7h2v4Zm0-5H7V4h2v2Z" />
              </svg>
              {status === "done" ? "Regenerate Brief" : "Generate This Week's Brief"}
            </>
          )}
        </button>
      </div>

      {status === "idle" && (
        <div className="border border-surface-border border-dashed rounded-lg p-8 text-center">
          <div className="text-3xl mb-3">📋</div>
          <p className="text-slate-400 text-sm max-w-sm mx-auto font-mono tracking-wide">
            Click <span className="text-brand font-medium">Generate This Week&apos;s Brief</span> to have Claude analyze the latest market data and produce a procurement intelligence report.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="border border-red-900 bg-red-950/20 rounded-lg p-4">
          <p className="text-red-400 text-sm font-mono">Error: {error}</p>
          <p className="text-slate-500 text-xs mt-1">Check your ANTHROPIC_API_KEY in .env.local</p>
        </div>
      )}

      {(status === "loading" || status === "done") && content && (
        <div className="bg-surface-raised border border-surface-border rounded-lg p-6">
          {/* Letterhead */}
          <div className="flex items-start justify-between mb-5 pb-4 border-b border-surface-border">
            <div>
              <div className="text-brand font-mono font-bold text-lg tracking-widest uppercase">
                TIBER BRIEF
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5 tracking-wider uppercase">
                Weekly Supply Chain Intelligence Report
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right text-xs text-slate-600 font-mono">
                <div>
                  {generatedAt
                    ? new Date(generatedAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Generating…"}
                </div>
                <div className="text-slate-700 mt-0.5 tracking-wider uppercase text-[10px]">Powered by Claude Opus 4.6</div>
              </div>
              {status === "done" && (
                <button
                  onClick={copyBrief}
                  className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-brand transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
                      </svg>
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
                      </svg>
                      Copy brief
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="prose-brief">
            {renderMarkdown(content)}
          </div>

          {status === "loading" && (
            <span className="inline-block w-1.5 h-4 bg-brand ml-1 animate-pulse rounded-sm align-middle" />
          )}
        </div>
      )}

      {status === "done" && (
        <p className="text-xs text-slate-600 mt-2 font-mono">
          {fromCache
            ? "⚡ Cached — refreshes every 24h · "
            : "Generated by Claude Opus 4.6 · "}
          Data: FRED (Federal Reserve) · Not financial advice
        </p>
      )}
    </section>
  );
}
