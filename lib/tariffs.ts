/**
 * US import tariff data for tracked commodities.
 * Rates reflect Section 232 / Section 301 actions as of March 2025.
 * Static by design — tariff policy changes infrequently enough that
 * manual updates are appropriate. See lastReviewed date below.
 */

export interface TariffInfo {
  commodityId: string;
  authority: string;    // "Section 232" | "Section 301" | "MFN" | "None"
  ratePercent: number;  // effective rate on most imports (0–100)
  htsCodes: string[];   // informational HTS chapter/heading codes
  notes: string;
  lastReviewed: string; // ISO date — when these rates were last verified
}

export const TARIFF_MAP: Record<string, TariffInfo> = {
  steel_ppi: {
    commodityId: "steel_ppi",
    authority: "Section 232",
    ratePercent: 25,
    htsCodes: ["7206", "7207", "7208", "7209", "7210"],
    notes: "25% on steel mill products from most origins. Quota agreements with EU, UK, and Japan reduce exposure for allied-nation sourcing.",
    lastReviewed: "2025-03-01",
  },
  aluminum: {
    commodityId: "aluminum",
    authority: "Section 232",
    ratePercent: 25,
    htsCodes: ["7601", "7604", "7606", "7607"],
    notes: "Raised to 25% in March 2025. Previously 10%. Country-specific quota agreements may apply for select allies.",
    lastReviewed: "2025-03-01",
  },
  copper: {
    commodityId: "copper",
    authority: "Section 232",
    ratePercent: 25,
    htsCodes: ["7401", "7402", "7403", "7408"],
    notes: "25% rate announced via Section 232 investigation (Feb 2025). Markets began pricing in exposure immediately.",
    lastReviewed: "2025-03-01",
  },
  zinc: {
    commodityId: "zinc",
    authority: "MFN",
    ratePercent: 3,
    htsCodes: ["7901", "7904"],
    notes: "Standard MFN tariff rate. No active Section 232 investigation. Additional tariffs may apply for Chinese-origin imports.",
    lastReviewed: "2025-03-01",
  },
  nickel: {
    commodityId: "nickel",
    authority: "MFN",
    ratePercent: 0,
    htsCodes: ["7502", "7503"],
    notes: "Near-zero MFN rate. No active Section 232 investigation as of review date.",
    lastReviewed: "2025-03-01",
  },
  crude_oil: {
    commodityId: "crude_oil",
    authority: "None",
    ratePercent: 0,
    htsCodes: ["2709"],
    notes: "US is now a net oil exporter. Domestic WTI price is unaffected by import tariffs. Canadian crude faces a 10% Section 232 tariff.",
    lastReviewed: "2025-03-01",
  },
  natural_gas: {
    commodityId: "natural_gas",
    authority: "None",
    ratePercent: 0,
    htsCodes: ["2711"],
    notes: "US is a major LNG exporter. Henry Hub pricing reflects domestic supply/demand — import tariffs are not a factor.",
    lastReviewed: "2025-03-01",
  },
};

export function getTariff(commodityId: string): TariffInfo | null {
  return TARIFF_MAP[commodityId] ?? null;
}

/** Estimated price including tariff for imported material */
export function landedCost(basePrice: number, ratePercent: number): number {
  return basePrice * (1 + ratePercent / 100);
}
