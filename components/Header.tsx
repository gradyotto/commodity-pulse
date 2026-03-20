interface Props {
  fetchedAt: string;
}

export function Header({ fetchedAt }: Props) {
  const date = new Date(fetchedAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <header className="border-b border-surface-border pb-5 mb-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                Commodity Pulse
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Supply Chain Intelligence for Hardware &amp; Manufacturing
              </p>
            </div>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-600 text-right">
          <div>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 align-middle" />
            Live data — FRED / Federal Reserve
          </div>
          <div className="mt-0.5">Last fetched: {date}</div>
        </div>
      </div>
    </header>
  );
}
