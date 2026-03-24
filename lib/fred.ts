/**
 * FRED (Federal Reserve Economic Data) API client.
 * Free API key: https://fred.stlouisfed.org/docs/api/api_key.html
 *
 * AlphaVantage is tried first for metals and crude oil when
 * ALPHA_VANTAGE_API_KEY is set; FRED is the fallback.
 */

import type { CommodityData, ShippingIndicator, PricePoint } from "@/types";
import { fetchAVNaturalGas } from "./alphavantage";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";
const KEY = process.env.FRED_API_KEY ?? "";

// ── FRED series IDs ──────────────────────────────────────────────────────────
const SERIES = {
  // Commodities — World Bank / IMF Primary Commodity Prices (monthly, USD/metric ton)
  copper:   "PCOPPUSDM",   // Global price of Copper
  aluminum: "PALUMUSDM",   // Global price of Aluminum
  zinc:     "PZINCUSDM",   // Global price of Zinc
  nickel:   "PNICKUSDM",   // Global price of Nickel
  crudeOil: "DCOILWTICO",  // WTI Crude Oil ($/barrel, daily)
  steelPPI: "WPU1017",     // BLS PPI: Iron & Steel (index, monthly)

  // Shipping / Logistics
  diesel:   "GASDESW",   // EIA: US On-Highway Diesel Fuel Prices ($/gal, weekly)
  invRatio: "ISRATIO",   // Total Business: Inventories to Sales Ratio (monthly)
  mfgProd:  "IPMAN",     // Fed: Industrial Production — Manufacturing Index (monthly)
} as const;

interface FredObs {
  date: string;
  value: string; // "." when missing
}

// Returns null instead of throwing — callers decide how to handle failures
async function fetchSeries(
  seriesId: string,
  limit = 14,
  sortOrder: "desc" | "asc" = "desc"
): Promise<FredObs[] | null> {
  try {
    const url = new URL(FRED_BASE);
    url.searchParams.set("series_id", seriesId);
    url.searchParams.set("api_key", KEY);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("sort_order", sortOrder);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      console.error(`FRED ${seriesId}: HTTP ${res.status}`);
      return null;
    }

    const json = (await res.json()) as { observations: FredObs[] };
    const valid = json.observations.filter((o) => o.value !== ".");
    return valid.length > 0 ? valid : null;
  } catch (err) {
    console.error(`FRED ${seriesId}:`, err);
    return null;
  }
}

function toPoints(obs: FredObs[]): PricePoint[] {
  return [...obs]
    .reverse()
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }));
}

function calcChange(current: number, prior: number): number {
  if (prior === 0) return 0;
  return parseFloat((((current - prior) / prior) * 100).toFixed(2));
}

// ── Commodity fetchers ────────────────────────────────────────────────────────

async function fetchMonthlyMetal(
  seriesId: string,
  meta: { id: string; name: string; symbol: string; unit: string }
): Promise<CommodityData | null> {
  const obs = await fetchSeries(seriesId, 14);
  if (!obs || obs.length < 2) return null;

  const points = toPoints(obs);
  const current = points.at(-1)!;
  const prior = points.at(-2) ?? current;

  return {
    ...meta,
    currentPrice: current.value,
    priorPrice: prior.value,
    changePercent: calcChange(current.value, prior.value),
    history: points,
    frequency: "monthly",
    source: "FRED / World Bank",
    lastUpdated: current.date,
  };
}

async function fetchCrudeOil(): Promise<CommodityData | null> {
  const obs = await fetchSeries(SERIES.crudeOil, 60, "desc");
  if (!obs || obs.length < 2) return null;

  const points = toPoints(obs);
  const current = points.at(-1)!;
  const prior = points.at(-22) ?? points.at(-2) ?? current;

  return {
    id: "crude_oil",
    name: "Crude Oil (WTI)",
    symbol: "WTI",
    unit: "$/barrel",
    currentPrice: current.value,
    priorPrice: prior.value,
    changePercent: calcChange(current.value, prior.value),
    history: points.slice(-30),
    frequency: "daily",
    source: "FRED / EIA",
    lastUpdated: current.date,
  };
}

async function fetchSteelPPI(): Promise<CommodityData | null> {
  const obs = await fetchSeries(SERIES.steelPPI, 14);
  if (!obs || obs.length < 2) return null;

  const points = toPoints(obs);
  const current = points.at(-1)!;
  const prior = points.at(-2) ?? current;

  return {
    id: "steel_ppi",
    name: "Steel (PPI Index)",
    symbol: "STEEL",
    unit: "index (2012=100)",
    currentPrice: current.value,
    priorPrice: prior.value,
    changePercent: calcChange(current.value, prior.value),
    history: points,
    frequency: "monthly",
    source: "FRED / BLS WPU1017",
    lastUpdated: current.date,
  };
}

// ── Shipping fetchers ─────────────────────────────────────────────────────────

async function fetchDiesel(): Promise<ShippingIndicator | null> {
  const obs = await fetchSeries(SERIES.diesel, 20, "desc");
  if (!obs || obs.length < 2) return null;

  const points = toPoints(obs);
  const current = points.at(-1)!;
  const prior = points.at(-5) ?? points.at(-2) ?? current; // ~1 month ago

  return {
    id: "diesel",
    name: "Diesel Fuel Price",
    shortName: "Diesel",
    currentValue: current.value,
    priorValue: prior.value,
    changePercent: calcChange(current.value, prior.value),
    history: points.slice(-16),
    unit: "$/gallon",
    description: "EIA US on-highway diesel retail price. Primary operating cost for domestic freight — directly impacts trucking rates.",
    higherIsBad: true,
    source: "FRED / EIA",
    lastUpdated: current.date,
  };
}

async function fetchInventoryRatio(): Promise<ShippingIndicator | null> {
  const obs = await fetchSeries(SERIES.invRatio, 14);
  if (!obs || obs.length < 2) return null;

  const points = toPoints(obs);
  const current = points.at(-1)!;
  const prior = points.at(-2) ?? current;

  return {
    id: "inv_ratio",
    name: "Business Inventories/Sales Ratio",
    shortName: "Inventory Ratio",
    currentValue: current.value,
    priorValue: prior.value,
    changePercent: calcChange(current.value, prior.value),
    history: points,
    unit: "ratio (months of supply)",
    description: "Total business inventories relative to sales. Rising ratio signals supply chain slack or slowing demand.",
    higherIsBad: false, // context-dependent; shown as neutral
    source: "FRED / Census Bureau",
    lastUpdated: current.date,
  };
}

async function fetchMfgProduction(): Promise<ShippingIndicator | null> {
  const obs = await fetchSeries(SERIES.mfgProd, 14);
  if (!obs || obs.length < 2) return null;

  const points = toPoints(obs);
  const current = points.at(-1)!;
  const prior = points.at(-2) ?? current;

  return {
    id: "mfg_prod",
    name: "Manufacturing Production Index",
    shortName: "Mfg. Output",
    currentValue: current.value,
    priorValue: prior.value,
    changePercent: calcChange(current.value, prior.value),
    history: points,
    unit: "index (2017=100)",
    description: "Federal Reserve Industrial Production index for manufacturing. Rising index = growing output and raw material demand.",
    higherIsBad: false,
    source: "FRED / Federal Reserve",
    lastUpdated: current.date,
  };
}

// ── Public exports ────────────────────────────────────────────────────────────

export async function fetchAllCommodities(): Promise<CommodityData[]> {
  const hasAV = !!process.env.ALPHA_VANTAGE_API_KEY;

  // Metals and crude oil come from FRED (authoritative, no rate limits).
  // Natural Gas is AV-only — no equivalent FRED series.
  const [fredCopper, fredAluminum, fredZinc, fredNickel, fredCrudeOil, fredSteel, avNatGas] =
    await Promise.all([
      fetchMonthlyMetal(SERIES.copper,   { id: "copper",   name: "Copper",   symbol: "CU", unit: "$/metric ton" }),
      fetchMonthlyMetal(SERIES.aluminum, { id: "aluminum", name: "Aluminum", symbol: "AL", unit: "$/metric ton" }),
      fetchMonthlyMetal(SERIES.zinc,     { id: "zinc",     name: "Zinc",     symbol: "ZN", unit: "$/metric ton" }),
      fetchMonthlyMetal(SERIES.nickel,   { id: "nickel",   name: "Nickel",   symbol: "NI", unit: "$/metric ton" }),
      fetchCrudeOil(),   // daily WTI spot — FRED/EIA
      fetchSteelPPI(),
      hasAV ? fetchAVNaturalGas() : null,
    ]);

  return [
    fredCopper,
    fredAluminum,
    fredZinc,
    fredNickel,
    fredCrudeOil,
    fredSteel,
    avNatGas,
  ].filter((r): r is CommodityData => r !== null);
}

export async function fetchAllShipping(): Promise<ShippingIndicator[]> {
  const results = await Promise.all([
    fetchDiesel(),
    fetchInventoryRatio(),
    fetchMfgProduction(),
  ]);

  return results.filter((r): r is ShippingIndicator => r !== null);
}
