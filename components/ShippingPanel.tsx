"use client";

import { TrendSparkline } from "./TrendSparkline";
import type { ShippingIndicator } from "@/types";
import clsx from "clsx";

interface Props {
  indicators: ShippingIndicator[];
}

function IndicatorRow({ s }: { s: ShippingIndicator }) {
  const isUp = s.changePercent > 0;
  const isBad = s.higherIsBad ? isUp : !isUp;

  const trendColor = isBad ? "text-red-400" : "text-green-400";
  const badgeBg = isBad ? "bg-red-950 text-red-400" : "bg-green-950 text-green-400";
  const arrow = isUp ? "↑" : "↓";

  return (
    <div className="border border-surface-border rounded-lg p-4 hover:border-brand/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-sm font-medium text-slate-200">{s.shortName}</div>
          <div className="text-xs text-slate-500 mt-0.5 leading-snug">{s.description}</div>
        </div>
        <div className="text-right shrink-0">
          <div className={clsx("text-base font-mono font-semibold", trendColor)}>
            {s.currentValue.toFixed(1)}
          </div>
          <div
            className={clsx(
              "text-xs font-mono px-1.5 py-0.5 rounded mt-1",
              badgeBg
            )}
          >
            {arrow} {Math.abs(s.changePercent).toFixed(1)}%
          </div>
        </div>
      </div>

      <TrendSparkline data={s.history} positive={!isBad} />

      <div className="text-xs text-slate-600 font-mono mt-1">
        {s.unit} · {s.lastUpdated}
      </div>
    </div>
  );
}

export function ShippingPanel({ indicators }: Props) {
  return (
    <section>
      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
        Logistics & Freight
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {indicators.map((s) => (
          <IndicatorRow key={s.id} s={s} />
        ))}
      </div>
      <p className="text-xs text-slate-600 mt-2">
        Trucking & ocean freight: FRED BLS PPI indices. ISM Supplier Deliveries: above 50 = longer lead times. Sources reflect most recently published government data.
      </p>
    </section>
  );
}
