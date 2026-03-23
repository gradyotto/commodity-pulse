# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run lint     # ESLint
```

No test suite is configured.

## Architecture

**Commodity Pulse** is a Next.js 14 supply chain intelligence dashboard branded for Tiber Manufacturing. It fetches economic data from the FRED API, computes a real-time supply chain health score, and generates an AI-powered "Builder's Brief" procurement newsletter via Claude.

### Stack
- **Next.js 14** (App Router) with TypeScript strict mode
- **Tailwind CSS** dark theme — brand color `#ff8800`, background `#0d0d0d`
- **Anthropic Claude** (`claude-opus-4-6` with adaptive/extended thinking) for AI briefs and card analysis
- **Vercel KV** for caching (graceful degradation if unavailable)
- **Recharts** for the 30-day health score history chart

### Key Files
| Path | Purpose |
|------|---------|
| `app/page.tsx` | Server component — fetches all data, renders dashboard |
| `lib/fred.ts` | FRED API client — fetches commodity prices + shipping indicators |
| `lib/healthScore.ts` | Computes 0–100 health score from price pressure, stability, logistics |
| `lib/scoreHistory.ts` | Stores/retrieves 30-day score history in Vercel KV |
| `app/api/brief/route.ts` | Streams Claude-generated Builder's Brief (24h KV cache) |
| `app/api/analyze/route.ts` | Streams per-card Claude analysis (6h KV cache) |
| `components/BuildersBrief.tsx` | On-demand brief UI with streaming markdown renderer |
| `components/DetailModal.tsx` | Card detail modal with streaming analysis |
| `types/index.ts` | Shared TypeScript interfaces (`CommodityData`, `ShippingIndicator`, etc.) |

### Data Flow
1. `app/page.tsx` fetches FRED data in parallel → computes health score → records to KV → renders server components
2. Client components handle interactivity: brief generation and card detail modals stream from `/api/brief` and `/api/analyze`
3. Both API routes check KV cache before calling Claude; stream responses back via `TransformStream`

### FRED Series Tracked
- **Commodities:** Copper (`PCOPPUSDM`), Aluminum (`PALUMUSDM`), Zinc (`PZINCUSDM`), Nickel (`PNICKUSDM`), WTI Crude Oil (`DCOILWTICO`), Steel PPI (`WPU1017`)
- **Shipping/Logistics:** Diesel (`GASDESW`), Inventory/Sales Ratio (`ISRATIO`), Manufacturing Production (`IPMAN`)

### Environment Variables
See `.env.local.example`. Required: `ANTHROPIC_API_KEY`, `FRED_API_KEY`. Optional but needed for caching: `KV_REST_API_URL`, `KV_REST_API_TOKEN`.

### iframe Embedding
`next.config.mjs` sets `X-Frame-Options: ALLOWALL` to allow embedding on tibermfg.com.
