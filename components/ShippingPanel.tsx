"use client";

import { useState } from "react";
import { TrendSparkline } from "./TrendSparkline";
import { DetailModal } from "./DetailModal";
import type { ShippingIndicator } from "@/types";
import clsx from "clsx";

interface Props {
  indicators: ShippingIndicator[];
}

function IndicatorRow({ s }: { s: ShippingIndicator }) {
  const [open, setOpen] = useState(false);
  const isUp  = s.changePercent > 0;
  const isBad = s.higherIsBad ? isUp : !isUp;

  const trendColor = isBad ? "text-red-400" : "text-green-400";
  const badgeBg    = isBad ? "bg-red-950 text-red-400" : "bg-green-950 text-green-400";
  const arrow      = isUp ? "↑" : "↓";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-surface-border rounded-lg p-4 hover:border-brand/50 transition-all text-left w-full cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-sm font-medium text-slate-200 group-hover:text-brand transition-colors">
              {s.shortName}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 leading-snug">{s.description}</div>
          </div>
          <div className="text-right shrink-0">
            <div className={clsx("text-base font-mono font-semibold", trendColor)}>
              {s.currentValue.toFixed(1)}
            </div>
            <div className={clsx("text-xs font-mono px-1.5 py-0.5 rounded mt-1", badgeBg)}>
              {arrow} {Math.abs(s.changePercent).toFixed(1)}%
            </div>
          </div>
        </div>

        <TrendSparkline data={s.history} positive={!isBad} />

        <div className="flex items-center justify-between text-xs font-mono mt-1">
          <span className="text-slate-600">{s.unit} · {s.lastUpdated}</span>
          <span className="flex items-center gap-1 text-slate-700 group-hover:text-slate-500 transition-colors">
            View analysis
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </button>

      {open && (
        <DetailModal
          target={{ type: "indicator", data: s }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function ShippingPanel({ indicators }: Props) {
  return (
    <section className="isolate">
      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
        Logistics & Freight
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {indicators.map((s) => (
          <IndicatorRow key={s.id} s={s} />
        ))}
      </div>
      <p className="text-xs text-slate-600 mt-2">
        Diesel prices: EIA weekly on-highway retail. Inventory/Sales ratio: U.S. Census Bureau. Manufacturing production: Federal Reserve. Click any card for AI analysis.
      </p>
    </section>
  );
}
