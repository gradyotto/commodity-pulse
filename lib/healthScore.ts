import type { CommodityData, ShippingIndicator } from "@/types";

export interface HealthScoreBreakdown {
  /** 0-40: penalizes rising commodity prices for buyers */
  pricePressure: number;
  pricePressureMax: 40;

  /** 0-30: penalizes erratic price swings in any direction */
  priceStability: number;
  priceStabilityMax: 30;

  /** 0-30: composite of freight costs, inventory ratio, and manufacturing activity */
  logistics: number;
  logisticsMax: 30;

  /** 0-100: sum of all three components */
  total: number;

  label: "Strong" | "Stable" | "Cautious" | "Stressed" | "Critical";
  color: "green" | "lime" | "yellow" | "orange" | "red";

  /** Descriptive sentence used in the UI and passed to Claude */
  summary: string;

  /** Used for tooltip / explanation in the UI */
  avgPriceChange: number;   // mean % change across commodities
  avgAbsChange: number;     // mean |%| change — volatility proxy
}

// ── Label / color thresholds ─────────────────────────────────────────────────

function getLabel(score: number): HealthScoreBreakdown["label"] {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Stable";
  if (score >= 45) return "Cautious";
  if (score >= 25) return "Stressed";
  return "Critical";
}

function getColor(score: number): HealthScoreBreakdown["color"] {
  if (score >= 80) return "green";
  if (score >= 65) return "lime";
  if (score >= 45) return "yellow";
  if (score >= 25) return "orange";
  return "red";
}

function getSummary(
  score: number,
  label: HealthScoreBreakdown["label"],
  avgPriceChange: number
): string {
  const direction =
    avgPriceChange > 2
      ? `with average input costs rising ${avgPriceChange.toFixed(1)}%`
      : avgPriceChange < -2
      ? `with average input costs falling ${Math.abs(avgPriceChange).toFixed(1)}%`
      : "with commodity prices broadly flat";

  const outlook: Record<HealthScoreBreakdown["label"], string> = {
    Strong:   `Supply chain conditions are favorable ${direction}. Low volatility and stable logistics support confident procurement.`,
    Stable:   `Supply chain conditions are broadly stable ${direction}. Minor pressure points exist but no systemic stress.`,
    Cautious: `Supply chain conditions warrant attention ${direction}. Consider accelerating near-term purchases or locking in contracts.`,
    Stressed: `Supply chain conditions are under strain ${direction}. Procurement teams should audit exposure and hedge where possible.`,
    Critical: `Supply chain conditions are severely disrupted ${direction}. Immediate review of procurement strategy is recommended.`,
  };

  return outlook[label];
}

// ── Scoring logic ─────────────────────────────────────────────────────────────

export function computeHealthScore(
  commodities: CommodityData[],
  shipping: ShippingIndicator[]
): HealthScoreBreakdown {

  // ── 1. Material Cost Pressure (0–40 pts) ─────────────────────────────────
  // For buyers: rising prices = bad. Starts at 30 (neutral).
  // Each 1% average price increase = -1 pt. Each 1% decrease = +1 pt. Capped 0–40.
  const priceChanges = commodities.map((c) => c.changePercent);
  const avgPriceChange =
    priceChanges.length > 0
      ? priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length
      : 0;

  const pricePressure = Math.round(
    Math.max(0, Math.min(40, 30 - avgPriceChange))
  );

  // ── 2. Price Stability (0–30 pts) ────────────────────────────────────────
  // Volatile prices in either direction make planning impossible.
  // Avg absolute change: 0% = 30pts, 5% avg = 20pts, 15% avg = 0pts.
  const avgAbsChange =
    priceChanges.length > 0
      ? priceChanges.reduce((a, b) => a + Math.abs(b), 0) / priceChanges.length
      : 0;

  const priceStability = Math.round(Math.max(0, 30 - avgAbsChange * 2));

  // ── 3. Logistics Health (0–30 pts, three sub-components of 10 each) ──────
  let logisticsRaw = 0;
  let logisticsMax = 0; // scales to 30 even if some indicators are unavailable

  // Sub-component A: Trucking PPI (0–10 pts)
  // Rising freight costs eat into margins — penalize upward trend.
  const truck = shipping.find((s) => s.id === "truck_ppi");
  if (truck) {
    logisticsMax += 10;
    // 0% change = 10pts, +5% = 5pts, +10% or more = 0pts
    logisticsRaw += Math.max(0, Math.min(10, 10 - truck.changePercent));
  }

  // Sub-component B: Business Inventories/Sales Ratio (0–10 pts)
  // Stability is best. Large swings signal either demand shock or supply glut.
  // We reward stability (low |change|) regardless of direction.
  const inv = shipping.find((s) => s.id === "inv_ratio");
  if (inv) {
    logisticsMax += 10;
    // 0% change = 10pts, 2% change = 6pts, 5%+ change = 0pts
    logisticsRaw += Math.max(0, Math.min(10, 10 - Math.abs(inv.changePercent) * 2));
  }

  // Sub-component C: ISM Manufacturing PMI (0–10 pts)
  // 50–55 = healthy expansion, ideal for manufacturers.
  // Below 45 = contraction (low demand, potential destocking).
  // Above 60 = overheating (supply shortages, long lead times).
  const ism = shipping.find((s) => s.id === "ism_pmi");
  if (ism) {
    logisticsMax += 10;
    const pmi = ism.currentValue;
    if (pmi >= 50 && pmi <= 55)       logisticsRaw += 10; // sweet spot
    else if (pmi > 55 && pmi <= 60)   logisticsRaw += 7;  // hot but ok
    else if (pmi >= 45 && pmi < 50)   logisticsRaw += 7;  // soft but manageable
    else if (pmi > 60 && pmi <= 65)   logisticsRaw += 4;  // overheating risk
    else if (pmi >= 40 && pmi < 45)   logisticsRaw += 4;  // contraction
    else                               logisticsRaw += 0;  // extreme either way
  }

  // Normalize to 30 pts if some indicators are missing
  const logistics =
    logisticsMax > 0
      ? Math.round((logisticsRaw / logisticsMax) * 30)
      : 15; // neutral default when no data

  // ── Final score ───────────────────────────────────────────────────────────
  const total = pricePressure + priceStability + logistics;
  const label = getLabel(total);

  return {
    pricePressure,
    pricePressureMax: 40,
    priceStability,
    priceStabilityMax: 30,
    logistics,
    logisticsMax: 30,
    total,
    label,
    color: getColor(total),
    summary: getSummary(total, label, avgPriceChange),
    avgPriceChange,
    avgAbsChange,
  };
}
