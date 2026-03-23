"use client";

import { useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { CommodityData, ShippingIndicator } from "@/types";
import { getTariff, landedCost } from "@/lib/tariffs";
import clsx from "clsx";

type Target =
  | { type: "commodity"; data: CommodityData }
  | { type: "indicator"; data: ShippingIndicator };

interface Props {
  target: Target;
  onClose: () => void;
}

function sourceUrl(id: string, dataSource?: string): string {
  if (dataSource === "alphavantage") {
    const avFn: Record<string, string> = {
      copper: "COPPER", aluminum: "ALUMINUM", zinc: "ZINC", nickel: "NICKEL",
      crude_oil: "CRUDE_OIL", natural_gas: "NATURAL_GAS",
    };
    const fn = avFn[id];
    return fn
      ? `https://www.alphavantage.co/query?function=${fn}&interval=monthly`
      : "https://www.alphavantage.co";
  }
  const fredSeries: Record<string, string> = {
    copper: "PCOPPUSDM", aluminum: "PALUMUSDM", zinc: "PZINCUSDM", nickel: "PNICKUSDM",
    crude_oil: "DCOILWTICO", steel_ppi: "WPU1017",
    diesel: "GASDESW", inv_ratio: "ISRATIO", mfg_prod: "IPMAN",
  };
  const series = fredSeries[id];
  return series ? `https://fred.stlouisfed.org/series/${series}` : "https://fred.stlouisfed.org";
}

function sourceLabel(dataSource?: string): string {
  return dataSource === "alphavantage" ? "View on AlphaVantage" : "View on FRED";
}

export function DetailModal({ target, onClose }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const history = target.type === "commodity" ? target.data.history : target.data.history;
  const name     = target.type === "commodity" ? target.data.name     : target.data.name;
  const unit     = target.type === "commodity" ? target.data.unit     : target.data.unit;
  const current  = target.type === "commodity" ? target.data.currentPrice : target.data.currentValue;
  const change   = target.type === "commodity" ? target.data.changePercent : target.data.changePercent;
  const id         = target.type === "commodity" ? target.data.id : target.data.id;
  const source     = target.type === "commodity" ? target.data.source : target.data.source;
  const updated    = target.type === "commodity" ? target.data.lastUpdated : target.data.lastUpdated;
  const dataSource = target.type === "commodity" ? target.data.dataSource : undefined;
  const tariff     = target.type === "commodity" ? getTariff(target.data.id) : null;

  const isUp   = change > 0;
  const isBad  = target.type === "commodity"
    ? isUp
    : target.data.higherIsBad ? isUp : !isUp;

  const trendColor = isBad ? "#ef4444" : "#22c55e";
  const trendText  = isBad ? "text-red-400" : "text-green-400";
  const arrow      = isUp ? "↑" : "↓";

  const values = history.map((p) => p.value);
  const hi  = Math.max(...values);
  const lo  = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  const fmt = (v: number) =>
    unit.includes("barrel") || unit.includes("index") || unit.includes("ratio") || unit.includes("gallon")
      ? v.toFixed(2)
      : v.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-[#0d0d0d] border border-surface-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0d0d0d] border-b border-surface-border px-6 py-4 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-slate-100">{name}</h2>
              <span className={clsx(
                "text-xs font-mono px-2 py-0.5 rounded",
                isBad ? "bg-red-950 text-red-400" : "bg-green-950 text-green-400"
              )}>
                {arrow} {Math.abs(change).toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{source} · Updated {updated}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1 ml-4 shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Current price + stats */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <div className={clsx("text-3xl font-mono font-bold", trendText)}>{fmt(current)}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{unit}</div>
            </div>
            <div className="flex gap-4 text-xs font-mono pb-1">
              {[["High", hi], ["Low", lo], ["Avg", avg]].map(([label, val]) => (
                <div key={label as string}>
                  <div className="text-slate-600 uppercase tracking-wider">{label as string}</div>
                  <div className="text-slate-300 mt-0.5">{fmt(val as number)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full chart */}
          <div className="bg-surface-raised border border-surface-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#4b5563", fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tickFormatter={(d: string) => d.slice(0, 7)}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "#4b5563", fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => fmt(v)}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141414", border: "1px solid #2a2d3a",
                    borderRadius: 6, fontSize: 12, color: "#e8e8e8",
                  }}
                  formatter={(v: number) => [fmt(v), unit]}
                  labelStyle={{ color: "#6b7280", fontFamily: "monospace", fontSize: 11 }}
                />
                <ReferenceLine y={avg} stroke="#2a2d3a" strokeDasharray="3 3" />
                <Line
                  type="monotone" dataKey="value"
                  stroke={trendColor} strokeWidth={2}
                  dot={false} activeDot={{ r: 4, fill: trendColor }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-700 font-mono mt-1 text-right">
              Dashed line = period average
            </p>
          </div>

          {/* Tariff block — commodities only, when a tariff applies */}
          {tariff && tariff.ratePercent > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-600">
                  Tariff Exposure
                </span>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  {tariff.authority} · +{tariff.ratePercent}%
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-mono">
                <div>
                  <div className="text-slate-600 uppercase tracking-wider">Base Price</div>
                  <div className="text-slate-300 mt-0.5">{fmt(current)} {unit}</div>
                </div>
                <div>
                  <div className="text-slate-600 uppercase tracking-wider">Landed (imports)</div>
                  <div className="text-amber-300 mt-0.5">
                    {fmt(landedCost(current, tariff.ratePercent))} {unit}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 uppercase tracking-wider">HTS Headings</div>
                  <div className="text-slate-400 mt-0.5">{tariff.htsCodes.slice(0, 3).join(", ")}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-snug">{tariff.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-border">
            <p className="text-xs text-slate-700 font-mono">Not financial advice · AI analysis may contain errors</p>
            <a
              href={sourceUrl(id, dataSource)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-slate-500 hover:text-brand transition-colors flex items-center gap-1"
            >
              {sourceLabel(dataSource)}
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7.5 1.5h3v3M10.5 1.5L6 6M5 2H2a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
