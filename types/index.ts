export interface PricePoint {
  date: string;
  value: number;
}

export interface CommodityData {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  currentPrice: number;
  priorPrice: number;   // 1 period ago
  changePercent: number;
  history: PricePoint[]; // ~12 most-recent periods, oldest-first
  frequency: "daily" | "monthly";
  source: string;
  lastUpdated: string;
}

export interface ShippingIndicator {
  id: string;
  name: string;
  shortName: string;
  currentValue: number;
  priorValue: number;
  changePercent: number;
  history: PricePoint[];
  unit: string;
  description: string;
  /** For buyers: higher = worse supply chain? */
  higherIsBad: boolean;
  source: string;
  lastUpdated: string;
}

export interface MarketSnapshot {
  commodities: CommodityData[];
  shipping: ShippingIndicator[];
  fetchedAt: string;
}

export interface BriefState {
  content: string;
  generatedAt: string;
  status: "idle" | "loading" | "done" | "error";
  error?: string;
}
