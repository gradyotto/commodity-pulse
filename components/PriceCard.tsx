"use client";

import { TrendSparkline } from "./TrendSparkline";
import type { CommodityData } from "@/types";
import clsx from "clsx";

interface Props {
  commodity: CommodityData;
}

export function PriceCard({ commodity: c }: Props) {
  const isUp = c.changePercent > 0;
  const isFlat = c.changePercent === 0;

  const trendColor = isFlat
    ? "text-slate-400"
    : isUp
    ? "text-red-400"   // price up = bad for buyers
    : "text-green-400"; // price down = good for buyers

  const badgeBg = isFlat
    ? "bg-slate-800 text-slate-400"
    : isUp
    ? "bg-red-950 text-red-400"
    : "bg-green-950 text-green-400";

  const arrow = isFlat ? "→" : isUp ? "↑" : "↓";

  // Format price nicely
  const formattedPrice =
    c.unit.includes("barrel") || c.unit.includes("index")
      ? c.currentPrice.toFixed(2)
      : c.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg p-4 flex flex-col gap-3 hover:border-brand/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">
              {c.symbol}
            </span>
            <span
              className={clsx(
                "text-xs font-mono px-1.5 py-0.5 rounded",
                badgeBg
              )}
            >
              {arrow} {Math.abs(c.changePercent).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-200 mt-0.5">
            {c.name}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <div className={clsx("text-lg font-mono font-semibold", trendColor)}>
            {formattedPrice}
          </div>
          <div className="text-xs text-slate-600 font-mono">{c.unit}</div>
        </div>
      </div>

      {/* Sparkline */}
      <TrendSparkline data={c.history} positive={!isUp} />

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
        <span>{c.frequency === "daily" ? "30-day" : "~12-month"} trend</span>
        <span>{c.lastUpdated}</span>
      </div>
    </div>
  );
}
