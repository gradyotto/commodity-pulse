import type { ReshoringCategory, CountryCost } from "@/lib/reshoring";
import clsx from "clsx";

interface Props {
  categories: ReshoringCategory[];
}

const COLOR_MAP = {
  green:  { badge: "bg-green-950/60 text-green-400 border-green-800/40",  bar: "bg-green-500"  },
  lime:   { badge: "bg-lime-950/60 text-lime-400 border-lime-800/40",     bar: "bg-lime-500"   },
  yellow: { badge: "bg-yellow-950/60 text-yellow-400 border-yellow-800/40", bar: "bg-yellow-500" },
  orange: { badge: "bg-orange-950/60 text-orange-400 border-orange-800/40", bar: "bg-orange-500" },
  red:    { badge: "bg-red-950/60 text-red-400 border-red-800/40",        bar: "bg-red-500"    },
} as const;

const COUNTRY_COLORS: Record<string, string> = {
  US:     "bg-brand",
  Mexico: "bg-blue-500",
  China:  "bg-slate-500",
};

function CostBar({ profile, maxIndex }: { profile: CountryCost; maxIndex: number }) {
  const pct = Math.round((profile.totalIndex / maxIndex) * 88); // 88% max width leaves room for labels
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="w-12 text-slate-500 text-right shrink-0">{profile.country}</span>
      <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full", COUNTRY_COLORS[profile.country])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-slate-400">{profile.totalIndex}</span>
    </div>
  );
}

function CategoryCard({ cat }: { cat: ReshoringCategory }) {
  const colors = COLOR_MAP[cat.opportunityColor];
  const maxIndex = Math.max(...cat.profiles.map((p) => p.totalIndex));

  return (
    <div className="bg-surface-raised border border-surface-border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-slate-200">{cat.name}</h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-snug">{cat.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={clsx("text-xs font-mono px-2 py-0.5 rounded border", colors.badge)}>
            {cat.opportunityLabel}
          </span>
          <div className="text-xs text-slate-600 font-mono mt-1">{cat.opportunityScore}/100</div>
        </div>
      </div>

      {/* Cost comparison bars */}
      <div className="space-y-1.5">
        {cat.profiles.map((p) => (
          <CostBar key={p.country} profile={p} maxIndex={maxIndex} />
        ))}
      </div>

      {/* Parity gap */}
      <div className="pt-1 border-t border-surface-border flex items-center justify-between text-xs font-mono">
        <span className="text-slate-600">Cost premium vs. offshore</span>
        <span className={clsx(
          cat.parityGap > 30 ? "text-orange-400" : cat.parityGap > 15 ? "text-yellow-400" : "text-lime-400"
        )}>
          +{cat.parityGap} pts
        </span>
      </div>
    </div>
  );
}

export function ReshoringPanel({ categories }: Props) {
  const anyOilAdjusted = categories.some((c) => c.oilAdjusted);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Reshoring Opportunity Index
        </h2>
        {anyOilAdjusted && (
          <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
            Live energy adjustment applied
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
      </div>

      {/* Legend + methodology note */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-700">
        <div className="flex items-center gap-3">
          {(["US", "Mexico", "China"] as const).map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className={clsx("inline-block h-2 w-2 rounded-sm", COUNTRY_COLORS[c])} />
              {c}
            </span>
          ))}
        </div>
        <span>·</span>
        <span>Index: US labor = 100 reference. Lower = cheaper to produce.</span>
        <span>·</span>
        <span>Offshore energy &amp; logistics adjusted for live WTI crude price.</span>
      </div>
    </section>
  );
}
