import type { CommodityData } from "@/types";
import clsx from "clsx";

interface Props {
  commodities: CommodityData[];
}

interface Signal {
  label: string;
  advice: string;
  barColor: string;
  textColor: string;
  badgeBg: string;
}

function getSignal(pos: number): Signal {
  if (pos >= 0.80) return {
    label: "Near High",
    advice: "Consider waiting",
    barColor: "bg-red-500",
    textColor: "text-red-400",
    badgeBg: "bg-red-950",
  };
  if (pos >= 0.60) return {
    label: "Elevated",
    advice: "Monitor closely",
    barColor: "bg-amber-500",
    textColor: "text-amber-400",
    badgeBg: "bg-amber-950",
  };
  if (pos >= 0.40) return {
    label: "Mid-Range",
    advice: "Neutral",
    barColor: "bg-slate-400",
    textColor: "text-slate-400",
    badgeBg: "bg-slate-800",
  };
  if (pos >= 0.20) return {
    label: "Favorable",
    advice: "Good entry point",
    barColor: "bg-lime-500",
    textColor: "text-lime-400",
    badgeBg: "bg-lime-950",
  };
  return {
    label: "Near Low",
    advice: "Buy window",
    barColor: "bg-green-500",
    textColor: "text-green-400",
    badgeBg: "bg-green-950",
  };
}

function fmt(v: number, unit: string): string {
  if (unit.includes("barrel") || unit.includes("gallon") || unit.includes("index") || unit.includes("ratio")) {
    return v.toFixed(2);
  }
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function RangeRow({ c }: { c: CommodityData }) {
  const values = c.history.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const range = hi - lo;

  // Clamp position between 0–100% even if current falls slightly outside history
  const pos = range > 0 ? Math.max(0, Math.min(1, (c.currentPrice - lo) / range)) : 0.5;
  const pct = Math.round(pos * 100);
  const signal = getSignal(pos);

  const windowLabel = c.frequency === "daily" ? "30-day" : "14-month";

  return (
    <div className="border border-surface-border rounded-lg p-4 space-y-3">
      {/* Top row: name + signal badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-200">{c.name}</div>
          <div className="text-xs font-mono text-slate-500 mt-0.5">{c.symbol} · {windowLabel} range</div>
        </div>
        <div className="text-right shrink-0">
          <span className={clsx(
            "text-xs font-mono font-semibold px-2 py-0.5 rounded",
            signal.textColor, signal.badgeBg
          )}>
            {signal.label}
          </span>
          <div className={clsx("text-[10px] font-mono mt-1 tracking-wide", signal.textColor)}>
            {signal.advice}
          </div>
        </div>
      </div>

      {/* Range bar */}
      <div className="space-y-1.5">
        <div className="relative h-2 bg-surface-border rounded-full overflow-visible">
          {/* Fill */}
          <div
            className={clsx("absolute inset-y-0 left-0 rounded-full", signal.barColor)}
            style={{ width: `${pct}%` }}
          />
          {/* Pip */}
          <div
            className={clsx(
              "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#0d0d0d]",
              signal.barColor
            )}
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>

        {/* Range labels */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
          <span>↓ {fmt(lo, c.unit)}</span>
          <span className={clsx("font-semibold", signal.textColor)}>
            {fmt(c.currentPrice, c.unit)} {c.unit}
          </span>
          <span>↑ {fmt(hi, c.unit)}</span>
        </div>
      </div>
    </div>
  );
}

export function PriceRangePanel({ commodities }: Props) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Price Range Tracker
        </h2>
        <span className="text-xs font-mono text-slate-700">
          Position within recent trading range
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {commodities.map((c) => (
          <RangeRow key={c.id} c={c} />
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-2 font-mono">
        Range based on available price history. Near Low = historically cheap relative to recent window · Near High = elevated · Not a buy/sell recommendation.
      </p>
    </section>
  );
}
