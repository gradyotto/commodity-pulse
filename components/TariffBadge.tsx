import type { TariffInfo } from "@/lib/tariffs";

interface Props {
  tariff: TariffInfo;
}

export function TariffBadge({ tariff }: Props) {
  if (tariff.ratePercent === 0) return null;

  const label =
    tariff.authority === "Section 232" ? "232" :
    tariff.authority === "Section 301" ? "301" :
    tariff.authority;

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40"
      title={tariff.notes}
    >
      <span className="text-amber-600">{label}</span>
      <span>·</span>
      <span>+{tariff.ratePercent}%</span>
    </span>
  );
}
