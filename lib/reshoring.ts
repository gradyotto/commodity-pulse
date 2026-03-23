/**
 * Reshoring Cost Parity Index.
 * Computes a cost comparison (US vs Mexico vs China) for common manufacturing
 * categories using static base indices, adjusted by live crude oil prices.
 *
 * Index is relative — US labor = 100 as the reference point.
 * Lower total index = cheaper to produce in that country.
 */

import type { CommodityData } from "@/types";

export interface CountryCost {
  country: "US" | "Mexico" | "China";
  laborIndex: number;
  energyIndex: number;
  logisticsIndex: number;
  totalIndex: number;
}

export interface ReshoringCategory {
  id: string;
  name: string;
  description: string;
  laborWeight: number;
  energyWeight: number;
  logisticsWeight: number;
  profiles: CountryCost[];
  /** US total index minus cheapest offshore total index */
  parityGap: number;
  /** 0–100: higher = US is closer to cost parity with offshore */
  opportunityScore: number;
  opportunityLabel: string;
  opportunityColor: "green" | "lime" | "yellow" | "orange" | "red";
  /** true when live crude oil price diverges >3% from the baseline */
  oilAdjusted: boolean;
}

// ── Base cost indices (US labor = 100 reference, 2024 baseline) ──────────────
// Labor:     relative manufacturing wage cost to produce equivalent output
// Energy:    relative factory energy cost (US benefits from cheap domestic natgas)
// Logistics: cost to deliver finished goods to a US customer
const BASE = {
  US:     { labor: 100, energy: 100, logistics: 12 },
  Mexico: { labor: 28,  energy: 85,  logistics: 32 },
  China:  { labor: 22,  energy: 72,  logistics: 82 },
} as const;

// 2024 annual average WTI price used as the neutral baseline
const OIL_BASELINE_USD = 77;

// ── Manufacturing categories ──────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "metal_fab",
    name: "Metal Fabrication",
    description: "Stamping, welding, CNC forming. Energy-intensive with moderate skilled-labor requirement.",
    laborWeight:    0.35,
    energyWeight:   0.40,
    logisticsWeight: 0.25,
  },
  {
    id: "elec_assembly",
    name: "Electronics Assembly",
    description: "PCB population, SMT, through-hole. Highly labor-intensive with relatively low energy use.",
    laborWeight:    0.55,
    energyWeight:   0.25,
    logisticsWeight: 0.20,
  },
  {
    id: "plastics",
    name: "Plastics & Composites",
    description: "Injection molding, thermoforming, fiber composites. Petrochemical feedstock drives energy cost.",
    laborWeight:    0.28,
    energyWeight:   0.50,
    logisticsWeight: 0.22,
  },
  {
    id: "machining",
    name: "Precision Machining",
    description: "CNC turning, milling, grinding. High skilled-labor premium; moderate energy footprint.",
    laborWeight:    0.48,
    energyWeight:   0.32,
    logisticsWeight: 0.20,
  },
] as const;

function getLabel(score: number): ReshoringCategory["opportunityLabel"] {
  if (score >= 80) return "Near Parity";
  if (score >= 60) return "Approaching";
  if (score >= 40) return "Moderate Gap";
  return "Large Gap";
}

function getColor(score: number): ReshoringCategory["opportunityColor"] {
  if (score >= 80) return "green";
  if (score >= 60) return "lime";
  if (score >= 40) return "yellow";
  return "orange";
}

export function computeReshoringData(commodities: CommodityData[]): ReshoringCategory[] {
  // Adjust offshore energy + logistics using live crude oil price.
  // When oil rises, longer supply chains become proportionally more expensive.
  // US is insulated: factory energy is largely natural-gas-based, not oil-based.
  const oilData = commodities.find((c) => c.id === "crude_oil");
  const oilPrice = oilData?.currentPrice ?? OIL_BASELINE_USD;
  const oilDelta = (oilPrice - OIL_BASELINE_USD) / OIL_BASELINE_USD;
  const oilAdjusted = Math.abs(oilDelta) > 0.03;

  const adjusted = {
    US: { ...BASE.US },
    Mexico: {
      labor:     BASE.Mexico.labor,
      energy:    BASE.Mexico.energy    * (1 + oilDelta * 0.35),
      logistics: BASE.Mexico.logistics * (1 + oilDelta * 0.45),
    },
    China: {
      labor:     BASE.China.labor,
      energy:    BASE.China.energy    * (1 + oilDelta * 0.55),
      logistics: BASE.China.logistics * (1 + oilDelta * 0.70),
    },
  };

  return CATEGORIES.map((cat) => {
    const profiles: CountryCost[] = (["US", "Mexico", "China"] as const).map((country) => {
      const b = adjusted[country];
      const total =
        cat.laborWeight     * b.labor +
        cat.energyWeight    * b.energy +
        cat.logisticsWeight * b.logistics;
      return {
        country,
        laborIndex:     Math.round(b.labor),
        energyIndex:    Math.round(b.energy),
        logisticsIndex: Math.round(b.logistics),
        totalIndex:     Math.round(total * 10) / 10,
      };
    });

    const usTotal     = profiles.find((p) => p.country === "US")!.totalIndex;
    const offshoreMin = Math.min(...profiles.filter((p) => p.country !== "US").map((p) => p.totalIndex));
    const parityGap   = Math.round((usTotal - offshoreMin) * 10) / 10;
    // Scale: gap of 0 = score 100 (parity); gap of 67 = score 0 (US 2× offshore cost)
    const opScore = Math.max(0, Math.min(100, Math.round(100 - parityGap * 1.5)));

    return {
      ...cat,
      profiles,
      parityGap,
      opportunityScore: opScore,
      opportunityLabel: getLabel(opScore),
      opportunityColor: getColor(opScore),
      oilAdjusted,
    };
  });
}
