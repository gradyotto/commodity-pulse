/**
 * AlphaVantage commodity data client.
 * Free key: https://www.alphavantage.co/support/#api-key (25 calls/day)
 * Returns null on failure — callers fall back to FRED.
 */

import type { CommodityData, PricePoint } from "@/types";

const AV_BASE = "https://www.alphavantage.co/query";
const KEY = process.env.ALPHA_VANTAGE_API_KEY ?? "";

// Monthly data; 12-hour cache is plenty (series updates once/month)
const REVALIDATE = 43200;

interface AVResponse {
  name: string;
  interval: string;
  unit: string;
  data: Array<{ date: string; value: string }>;
  Information?: string; // rate-limit or invalid-key message
  Note?: string;
}

async function fetchAVSeries(fn: string): Promise<AVResponse | null> {
  if (!KEY) return null;
  try {
    const url = new URL(AV_BASE);
    url.searchParams.set("function", fn);
    url.searchParams.set("interval", "monthly");
    url.searchParams.set("apikey", KEY);

    const res = await fetch(url.toString(), { next: { revalidate: REVALIDATE } });
    if (!res.ok) {
      console.error(`AV ${fn}: HTTP ${res.status}`);
      return null;
    }

    const json = (await res.json()) as AVResponse;
    if (json.Information || json.Note) {
      console.error(`AV ${fn}: API limit — ${json.Information ?? json.Note}`);
      return null;
    }
    if (!Array.isArray(json.data) || json.data.length < 2) return null;
    return json;
  } catch (err) {
    console.error(`AV ${fn}:`, err);
    return null;
  }
}

/** Convert AV "cents per pound" to $/metric ton (matches FRED unit for metals) */
function centsPerLbToPerTon(v: number): number {
  return (v / 100) * 2204.62;
}

function toPoints(
  data: AVResponse["data"],
  converter?: (v: number) => number
): PricePoint[] {
  return data
    .filter((d) => d.value !== "." && d.value !== "" && !isNaN(parseFloat(d.value)))
    .slice(0, 14)   // AV data is newest-first; take 14 most recent
    .reverse()       // flip to oldest-first for chart rendering
    .map((d) => {
      const raw = parseFloat(d.value);
      return { date: d.date, value: converter ? converter(raw) : raw };
    });
}

async function buildCommodity(
  fn: string,
  meta: Omit<CommodityData, "currentPrice" | "priorPrice" | "changePercent" | "history" | "source" | "lastUpdated" | "dataSource">,
  converter?: (v: number) => number
): Promise<CommodityData | null> {
  const res = await fetchAVSeries(fn);
  if (!res) return null;

  const points = toPoints(res.data, converter);
  if (points.length < 2) return null;

  const current = points.at(-1)!;
  const prior   = points.at(-2)!;
  const changePercent =
    prior.value !== 0
      ? parseFloat((((current.value - prior.value) / prior.value) * 100).toFixed(2))
      : 0;

  return {
    ...meta,
    currentPrice: current.value,
    priorPrice:   prior.value,
    changePercent,
    history:      points,
    source:       "AlphaVantage",
    lastUpdated:  current.date,
    dataSource:   "alphavantage",
  };
}

export function fetchAVCopper(): Promise<CommodityData | null> {
  return buildCommodity(
    "COPPER",
    { id: "copper", name: "Copper", symbol: "CU", unit: "$/metric ton", frequency: "monthly" },
    centsPerLbToPerTon
  );
}

export function fetchAVAluminum(): Promise<CommodityData | null> {
  return buildCommodity(
    "ALUMINUM",
    { id: "aluminum", name: "Aluminum", symbol: "AL", unit: "$/metric ton", frequency: "monthly" },
    centsPerLbToPerTon
  );
}

export function fetchAVZinc(): Promise<CommodityData | null> {
  return buildCommodity(
    "ZINC",
    { id: "zinc", name: "Zinc", symbol: "ZN", unit: "$/metric ton", frequency: "monthly" },
    centsPerLbToPerTon
  );
}

export function fetchAVNickel(): Promise<CommodityData | null> {
  return buildCommodity(
    "NICKEL",
    { id: "nickel", name: "Nickel", symbol: "NI", unit: "$/metric ton", frequency: "monthly" },
    centsPerLbToPerTon
  );
}

export function fetchAVCrudeOil(): Promise<CommodityData | null> {
  return buildCommodity("CRUDE_OIL", {
    id: "crude_oil",
    name: "Crude Oil (WTI)",
    symbol: "WTI",
    unit: "$/barrel",
    frequency: "monthly",
  });
}

export function fetchAVNaturalGas(): Promise<CommodityData | null> {
  return buildCommodity("NATURAL_GAS", {
    id: "natural_gas",
    name: "Natural Gas",
    symbol: "NG",
    unit: "$/MMBtu",
    frequency: "monthly",
  });
}
