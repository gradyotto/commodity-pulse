import type { CommodityData } from "@/types";
import { getTariff, landedCost } from "@/lib/tariffs";

interface Props {
  commodities: CommodityData[];
}

function fmt(v: number, unit: string): string {
  return unit.includes("barrel") || unit.includes("index") || unit.includes("MMBtu")
    ? v.toFixed(2)
    : v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function TariffPanel({ commodities }: Props) {
  const rows = commodities
    .map((c) => ({ c, tariff: getTariff(c.id) }))
    .filter(({ tariff }) => tariff !== null && tariff.ratePercent > 0);

  if (rows.length === 0) return null;

  // Blended tariff uplift: avg of (landed/base - 1) across tariffed commodities
  const avgUplift =
    rows.reduce((sum, { c, tariff }) => sum + tariff!.ratePercent, 0) / rows.length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Tariff Exposure
        </h2>
        <span className="text-xs font-mono text-amber-500/80 bg-amber-950/30 border border-amber-800/30 px-2 py-0.5 rounded">
          Avg uplift on imports: +{avgUplift.toFixed(0)}%
        </span>
      </div>

      <div className="border border-surface-border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2 bg-surface-raised border-b border-surface-border text-xs font-mono text-slate-600 uppercase tracking-wider">
          <span>Commodity</span>
          <span className="text-right">Base Price</span>
          <span className="text-right">Tariff</span>
          <span className="text-right">Landed (imports)</span>
        </div>

        {rows.map(({ c, tariff }, i) => {
          const landed = landedCost(c.currentPrice, tariff!.ratePercent);
          const isLast = i === rows.length - 1;
          return (
            <div
              key={c.id}
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-3 text-xs font-mono ${
                !isLast ? "border-b border-surface-border" : ""
              } ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}
            >
              <div>
                <span className="text-slate-300">{c.name}</span>
                <span className="text-slate-600 ml-2">{tariff!.authority}</span>
              </div>
              <span className="text-slate-400 text-right">
                {fmt(c.currentPrice, c.unit)} <span className="text-slate-600">{c.unit}</span>
              </span>
              <span className="text-amber-400 text-right font-semibold">
                +{tariff!.ratePercent}%
              </span>
              <div className="text-right">
                <span className="text-amber-300">{fmt(landed, c.unit)}</span>
                {/* Uplift bar */}
                <div className="mt-1 h-0.5 bg-surface-border rounded-full overflow-hidden w-20 ml-auto">
                  <div
                    className="h-full bg-amber-600/60 rounded-full"
                    style={{ width: `${Math.min(100, tariff!.ratePercent * 2)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-700 font-mono mt-2">
        Section 232 / 301 rates as of March 2025. Applies to imported material only — domestically sourced inputs are unaffected. Country-of-origin exemptions may reduce exposure.
      </p>
    </section>
  );
}
