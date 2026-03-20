/**
 * FRED (Federal Reserve Economic Data) API client.
 * Free API key: https://fred.stlouisfed.org/docs/api/api_key.html
 */

import type { CommodityData, ShippingIndicator, PricePoint } from "@/types";

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
  truckPPI: "PCU484000484000", // BLS PPI: Truck Transportation (monthly)
  invRatio: "ISRATIO",         // Total Business: Inventories to Sales Ratio
  ismPMI:   "NAPM",            // ISM Manufacturing PMI (>50 = expansion)
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

async function fetchTruckPPI(): Promise<ShippingIndicator | null> {
  const obs = await fetchSeries(SERIES.truckPPI, 14);
  if (!obs || obs.length < 2) return null;

  const points = toPoints(obs);
  const current = points.at(-1)!;
  const prior = points.at(-2) ?? current;

  return {
    id: "truck_ppi",
    name: "Domestic Freight (Trucking PPI)",
    shortName: "Trucking Costs",
    currentValue: current.value,
    priorValue: prior.value,
    changePercent: calcChange(current.value, prior.value),
    history: points,
    unit: "index (2012=100)",
    description: "BLS Producer Price Index for truck transportation. Rising index = higher domestic freight costs.",
    higherIsBad: true,
    source: "FRED / BLS PPI",
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

async function fetchISMPMI(): Promise<ShippingIndicator | null> {
  const obs = await fetchSeries(SERIES.ismPMI, 14);
  if (!obs || obs.length < 2) return null;

  const points = toPoints(obs);
  const current = points.at(-1)!;
  const prior = points.at(-2) ?? current;

  return {
    id: "ism_pmi",
    name: "ISM Manufacturing PMI",
    shortName: "Mfg. PMI",
    currentValue: current.value,
    priorValue: prior.value,
    changePercent: calcChange(current.value, prior.value),
    history: points,
    unit: "diffusion index",
    description: "ISM Manufacturing PMI. Above 50 = expansion (higher raw material demand). Below 50 = contraction.",
    higherIsBad: false, // higher PMI = more demand = potentially higher prices
    source: "FRED / ISM",
    lastUpdated: current.date,
  };
}

// ── Public exports ────────────────────────────────────────────────────────────

export async function fetchAllCommodities(): Promise<CommodityData[]> {
  const results = await Promise.all([
    fetchMonthlyMetal(SERIES.copper,   { id: "copper",   name: "Copper",   symbol: "CU",    unit: "$/metric ton" }),
    fetchMonthlyMetal(SERIES.aluminum, { id: "aluminum", name: "Aluminum", symbol: "AL",    unit: "$/metric ton" }),
    fetchMonthlyMetal(SERIES.zinc,     { id: "zinc",     name: "Zinc",     symbol: "ZN",    unit: "$/metric ton" }),
    fetchMonthlyMetal(SERIES.nickel,   { id: "nickel",   name: "Nickel",   symbol: "NI",    unit: "$/metric ton" }),
    fetchCrudeOil(),
    fetchSteelPPI(),
  ]);

  return results.filter((r): r is CommodityData => r !== null);
}

export async function fetchAllShipping(): Promise<ShippingIndicator[]> {
  const results = await Promise.all([
    fetchTruckPPI(),
    fetchInventoryRatio(),
    fetchISMPMI(),
  ]);

  return results.filter((r): r is ShippingIndicator => r !== null);
}
