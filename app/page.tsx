import { Suspense } from "react";
import { Header } from "@/components/Header";

// Always SSR — ensures health score and data are fresh on every load
export const revalidate = 0;
import { PriceCard } from "@/components/PriceCard";
import { ShippingPanel } from "@/components/ShippingPanel";
import { BuildersBrief } from "@/components/BuildersBrief";
import { HealthScore } from "@/components/HealthScore";
import { TariffPanel } from "@/components/TariffPanel";
import { ReshoringPanel } from "@/components/ReshoringPanel";
import { fetchAllCommodities, fetchAllShipping } from "@/lib/fred";
import { computeHealthScore } from "@/lib/healthScore";
import { computeReshoringData } from "@/lib/reshoring";
import { recordScore, getScoreHistory } from "@/lib/scoreHistory";
import type { CommodityData, ShippingIndicator } from "@/types";

async function Dashboard() {
  let commodities: CommodityData[] = [];
  let shipping: ShippingIndicator[] = [];
  const fetchedAt = new Date().toISOString();
  let error: string | null = null;

  try {
    [commodities, shipping] = await Promise.all([
      fetchAllCommodities(),
      fetchAllShipping(),
    ]);
    if (commodities.length === 0) {
      error = "No commodity data returned — check your FRED_API_KEY in .env.local";
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load market data";
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-950/30 border border-red-900 rounded-lg p-6 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-red-400 font-mono text-sm">{error}</p>
          <p className="text-slate-500 text-xs mt-2">
            Make sure <code className="text-slate-400">FRED_API_KEY</code> is set in{" "}
            <code className="text-slate-400">.env.local</code>
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Free key at{" "}
            <span className="text-slate-400">fred.stlouisfed.org/docs/api/api_key.html</span>
          </p>
        </div>
      </div>
    );
  }

  const healthScore    = computeHealthScore(commodities, shipping);
  const reshoringData  = computeReshoringData(commodities);

  // Use diesel (weekly FRED) as the staleness signal — it has a reliable
  // update cadence. Commodity dates are now AV monthly (inherently older)
  // and would cause false positives on the staleness warning.
  const lastDataDate = shipping.find((s) => s.id === "diesel")?.lastUpdated
    ?? shipping.map((s) => s.lastUpdated).sort().at(-1);

  // Record today's score + fetch 30-day history (fire-and-forget for recording)
  const [scoreHistory] = await Promise.all([
    getScoreHistory(),
    recordScore(healthScore.total, healthScore.label),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <Header fetchedAt={fetchedAt} lastDataDate={lastDataDate} />

      {/* Health Score — top of page, most prominent */}
      <HealthScore score={healthScore} history={scoreHistory} />

      {/* Commodity Prices */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
          Raw Material Prices
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {commodities.map((c) => (
            <PriceCard key={c.id} commodity={c} />
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-2 font-mono">
          Prices from AlphaVantage where available, FRED fallback (World Bank / EIA / BLS).
          Red = rising cost for buyers · Green = falling · Click any card for AI analysis.
        </p>
      </section>

      {/* Tariff Exposure */}
      <TariffPanel commodities={commodities} />

      {/* Shipping & Activity */}
      <ShippingPanel indicators={shipping} />

      {/* Reshoring Opportunity — hidden for now, revisit later */}
      {/* <ReshoringPanel categories={reshoringData} /> */}

      {/* AI Brief */}
      <BuildersBrief />

      {/* Embed instructions */}
      <section className="border-t border-surface-border pt-6">
        <details className="group">
          <summary className="text-xs font-mono uppercase tracking-widest text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">
            Embed on your website ▸
          </summary>
          <div className="mt-3 bg-surface-muted border border-surface-border rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-3">
              Add this iframe to any webpage to embed Tiber Pulse:
            </p>
            <pre className="text-xs font-mono text-slate-300 bg-surface rounded p-3 overflow-x-auto whitespace-pre-wrap">
{`<iframe
  src="https://pulse.tibermfg.com"
  width="100%"
  height="800"
  style="border:none;border-radius:8px;"
  title="Tiber Commodity Pulse"
></iframe>`}
            </pre>
          </div>
        </details>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-6 w-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin mb-3" />
            <p className="text-slate-500 text-sm font-mono">Loading market data…</p>
          </div>
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
