import { kv } from "@vercel/kv";

export interface ScoreRecord {
  date: string;  // YYYY-MM-DD
  score: number;
  label: string;
}

const HISTORY_KEY = "score:history";
const MAX_DAYS = 30;

export async function recordScore(score: number, label: string): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const existing: ScoreRecord[] = (await kv.get<ScoreRecord[]>(HISTORY_KEY)) ?? [];

    // Only record once per day — update if already exists today
    const filtered = existing.filter((r) => r.date !== today);
    const updated = [...filtered, { date: today, score, label }]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-MAX_DAYS);

    await kv.set(HISTORY_KEY, updated);
  } catch { /* skip if KV unavailable */ }
}

export async function getScoreHistory(): Promise<ScoreRecord[]> {
  try {
    return (await kv.get<ScoreRecord[]>(HISTORY_KEY)) ?? [];
  } catch {
    return [];
  }
}
