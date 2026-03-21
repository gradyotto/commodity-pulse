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
          <div className="flex items-center gap-4">
            {/* Tiber TT mark */}
            <div className="flex flex-col gap-0.5">
              <div className="flex gap-0.5">
                <div className="w-2 h-1 bg-brand" />
                <div className="w-0.5 h-1 bg-brand" />
                <div className="w-2 h-1 bg-brand" />
              </div>
              <div className="flex gap-0.5 justify-center">
                <div className="w-0.5 h-3 bg-brand" />
                <div className="w-1.5 h-0 " />
                <div className="w-0.5 h-3 bg-brand" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-black tracking-tighter text-[#eaeaea] uppercase">
                  TIBER
                </h1>
                <span className="text-brand font-mono text-xs font-medium tracking-widest uppercase">
                  Pulse
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 tracking-wider uppercase mt-0.5">
                Supply Chain Intelligence
              </p>
            </div>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-600 text-right tracking-wide">
          <div>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand mr-1.5 align-middle" />
            LIVE — FRED / Federal Reserve
          </div>
          <div className="mt-0.5 text-slate-700">Updated: {date}</div>
        </div>
      </div>
    </header>
  );
}
