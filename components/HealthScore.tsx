"use client";

import { useState, useEffect, useCallback } from "react";
import type { HealthScoreBreakdown } from "@/lib/healthScore";
import clsx from "clsx";

interface Props {
  score: HealthScoreBreakdown;
}

const COLOR_MAP = {
  green:  { ring: "#22c55e", text: "text-green-400",  bg: "bg-green-950/40",  border: "border-green-800" },
  lime:   { ring: "#84cc16", text: "text-lime-400",   bg: "bg-lime-950/40",   border: "border-lime-800"  },
  yellow: { ring: "#eab308", text: "text-yellow-400", bg: "bg-yellow-950/40", border: "border-yellow-800"},
  orange: { ring: "#f97316", text: "text-orange-400", bg: "bg-orange-950/40", border: "border-orange-800"},
  red:    { ring: "#ef4444", text: "text-red-400",    bg: "bg-red-950/40",    border: "border-red-900"   },
} as const;

// ── Gauge ─────────────────────────────────────────────────────────────────────

function Gauge({ score, color }: { score: number; color: string }) {
  const radius = 54;
  const cx = 64;
  const cy = 64;
  const strokeWidth = 8;
  const startAngle = 150;
  const arcSpan = 240;
  const fillAngle = (score / 100) * arcSpan;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(startDeg: number, endDeg: number) {
    const start = polarToCartesian(startDeg);
    const end = polarToCartesian(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const trackPath = describeArc(startAngle, startAngle + arcSpan);
  const fillPath = fillAngle > 0 ? describeArc(startAngle, startAngle + fillAngle) : null;

  return (
    <svg viewBox="0 0 128 100" className="w-36 h-28">
      <path d={trackPath} fill="none" stroke="#222" strokeWidth={strokeWidth} strokeLinecap="round" />
      {fillPath && (
        <path d={fillPath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      )}
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="26" fontWeight="bold" fontFamily="monospace" fill={color}>
        {score}
      </text>
    </svg>
  );
}

// ── Sub-score bar ─────────────────────────────────────────────────────────────

function SubBar({ label, value, max, description }: {
  label: string; value: number; max: number; description: string;
}) {
  const pct = Math.round((value / max) * 100);
  const barColor = pct >= 70 ? "bg-green-500" : pct >= 45 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-mono mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-500">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-600 mt-0.5 leading-snug">{description}</p>
    </div>
  );
}

// ── Methodology modal ─────────────────────────────────────────────────────────

function MethodologyModal({ onClose }: { onClose: () => void }) {
  // Close on Escape key
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const thresholds = [
    { label: "Strong",   range: "80 – 100", color: "text-green-400",  desc: "Favorable conditions. Stable prices, normal freight, healthy manufacturing activity." },
    { label: "Stable",   range: "65 – 79",  color: "text-lime-400",   desc: "Broadly normal. Minor pressure exists but no systemic stress." },
    { label: "Cautious", range: "45 – 64",  color: "text-yellow-400", desc: "Worth watching. Consider locking in contracts or accelerating near-term purchases." },
    { label: "Stressed", range: "25 – 44",  color: "text-orange-400", desc: "Strain is visible. Audit procurement exposure and hedge where possible." },
    { label: "Critical", range: "0 – 24",   color: "text-red-400",    desc: "Severe disruption. Immediate review of procurement strategy recommended." },
  ];

  const components = [
    {
      name: "Material Cost Pressure",
      weight: "40 pts",
      color: "text-brand",
      rows: [
        { item: "Baseline", detail: "Starts at 30/40 — represents neutral (flat) prices" },
        { item: "Formula",  detail: "30 − average % change across all tracked commodities" },
        { item: "Rising prices", detail: "−1pt per 1% average increase (bad for buyers)" },
        { item: "Falling prices", detail: "+1pt per 1% average decrease (good for buyers)" },
        { item: "Range",    detail: "Capped between 0 and 40" },
        { item: "Why",      detail: "Input cost direction is the single biggest lever on manufacturer margins" },
      ],
    },
    {
      name: "Price Stability",
      weight: "30 pts",
      color: "text-brand",
      rows: [
        { item: "Baseline", detail: "Starts at 30/30 — no price movement at all" },
        { item: "Formula",  detail: "30 − (2 × average absolute % change across commodities)" },
        { item: "Example",  detail: "If avg absolute swing is 5% → 30 − 10 = 20/30" },
        { item: "Key insight", detail: "Penalises volatility in either direction — a month where steel drops 8% and copper jumps 9% scores worse than a flat month, because erratic prices break contract pricing and procurement planning" },
      ],
    },
    {
      name: "Logistics Health",
      weight: "30 pts",
      color: "text-brand",
      rows: [
        { item: "Structure", detail: "Three sub-components of 10pts each, scaled to 30 if any indicator is unavailable" },
        { item: "Diesel Price (10pts)", detail: "10 − change%. Diesel is the primary cost driver for domestic freight — rising prices directly raise trucking rates" },
        { item: "Inventory/Sales Ratio (10pts)", detail: "10 − (2 × |change%|). Rewards stability — a big swing in either direction signals a demand shock or supply glut" },
        { item: "Mfg. Production Index (10pts)", detail: "≥+0.5% change = 10pts, flat = 7pts, slight decline = 4pts, contraction = 0pts. Rising output means healthy demand and supply chain efficiency" },
      ],
    },
  ];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      {/* Panel — stop click propagation so clicking inside doesn't close */}
      <div
        className="relative bg-[#111] border border-surface-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#111] border-b border-surface-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-semibold text-slate-100">How the Health Score Works</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Score methodology &amp; data sources</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-7">

          {/* Overview */}
          <div>
            <p className="text-sm text-slate-300 leading-relaxed">
              The Supply Chain Health Score is a <strong className="text-slate-100">0–100 composite index</strong> designed for procurement managers and operations teams at domestic hardware and manufacturing companies. It answers one question: <em className="text-slate-200">how favorable are current conditions for buying raw materials?</em>
            </p>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Higher is better. The score is computed from live FRED (Federal Reserve Economic Data) series and updates whenever the page refreshes. All inputs are publicly available government data — no proprietary feeds.
            </p>
          </div>

          {/* Components */}
          <div className="space-y-5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Score Components</h3>
            {components.map((c) => (
              <div key={c.name} className="bg-surface-raised border border-surface-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border">
                  <span className={clsx("text-sm font-semibold", c.color)}>{c.name}</span>
                  <span className="text-xs font-mono text-slate-500 bg-surface-border px-2 py-0.5 rounded">{c.weight}</span>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {c.rows.map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}>
                        <td className="px-4 py-2 font-mono text-slate-500 whitespace-nowrap w-40 align-top">{r.item}</td>
                        <td className="px-4 py-2 text-slate-300 leading-snug">{r.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Rating thresholds */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">Rating Thresholds</h3>
            <div className="space-y-2">
              {thresholds.map((t) => (
                <div key={t.label} className="flex items-start gap-3 text-sm">
                  <div className="flex items-center gap-2 w-36 shrink-0">
                    <span className={clsx("font-mono font-semibold", t.color)}>{t.label}</span>
                    <span className="text-slate-600 font-mono text-xs">{t.range}</span>
                  </div>
                  <span className="text-slate-400 leading-snug">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data sources */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">Data Sources</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {[
                ["Copper, Aluminum, Zinc, Nickel", "World Bank / IMF via FRED"],
                ["WTI Crude Oil", "U.S. EIA via FRED"],
                ["Steel (PPI)", "BLS — WPU1017 via FRED"],
                ["Diesel Fuel Price", "U.S. EIA — GASDESW via FRED"],
                ["Inventory/Sales Ratio", "U.S. Census Bureau via FRED"],
                ["Mfg. Production Index", "Federal Reserve — IPMAN via FRED"],
              ].map(([label, source]) => (
                <div key={label} className="bg-surface-raised border border-surface-border rounded p-2.5">
                  <div className="text-slate-400">{label}</div>
                  <div className="text-slate-600 mt-0.5">{source}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-slate-700 leading-relaxed border-t border-surface-border pt-4">
            This score is an informational index, not financial advice. Commodity prices and logistics indicators are based on the most recently published government data, which may lag real-time market conditions by days to weeks. Always consult qualified procurement or financial professionals before making material purchasing decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function HealthScore({ score: s }: Props) {
  const [showModal, setShowModal] = useState(false);
  const colors = COLOR_MAP[s.color];

  return (
    <section>
      {/* Section header with info button */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Supply Chain Health Score
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-slate-600 hover:text-brand transition-colors"
          aria-label="How is this score calculated?"
          title="How is this score calculated?"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-9.5a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4A.75.75 0 0 1 8 5.5Zm0-2.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Score card */}
      <div className={clsx("rounded-lg border p-5 flex flex-col sm:flex-row gap-6 items-start", colors.bg, colors.border)}>
        {/* Left: gauge + label */}
        <div className="flex flex-col items-center shrink-0 w-36">
          <Gauge score={s.total} color={colors.ring} />
          <span className={clsx("text-sm font-semibold font-mono tracking-wide -mt-1", colors.text)}>
            {s.label}
          </span>
          <span className="text-xs text-slate-600 font-mono mt-0.5">out of 100</span>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 text-xs text-slate-600 hover:text-brand font-mono underline underline-offset-2 transition-colors"
          >
            how is this calculated?
          </button>
        </div>

        {/* Right: summary + breakdown */}
        <div className="flex-1 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">{s.summary}</p>
          <div className="space-y-3">
            <SubBar
              label="Material Cost Pressure"
              value={s.pricePressure}
              max={s.pricePressureMax}
              description={`Avg commodity price change: ${s.avgPriceChange >= 0 ? "+" : ""}${s.avgPriceChange.toFixed(1)}%. Starts at 30/40 (neutral). −1pt per 1% rise, +1pt per 1% fall.`}
            />
            <SubBar
              label="Price Stability"
              value={s.priceStability}
              max={s.priceStabilityMax}
              description={`Avg volatility across commodities: ${s.avgAbsChange.toFixed(1)}% abs. change. High swings in any direction penalize this score.`}
            />
            <SubBar
              label="Logistics & Activity"
              value={s.logistics}
              max={s.logisticsMax}
              description="Composite of diesel fuel price trend (freight cost proxy), business inventory/sales ratio stability, and manufacturing production index growth."
            />
          </div>
        </div>
      </div>

      {/* Methodology modal */}
      {showModal && <MethodologyModal onClose={() => setShowModal(false)} />}
    </section>
  );
}
