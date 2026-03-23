interface Props {
  fetchedAt: string;
  lastDataDate?: string; // most recent date from any FRED series
}

export function Header({ fetchedAt, lastDataDate }: Props) {
  const date = new Date(fetchedAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  // Warn if most recent FRED data is more than 7 days old (EIA diesel updates Monday
  // afternoons, so on Monday morning the freshest weekly series is ~7 days old)
  const isStale = lastDataDate
    ? (Date.now() - new Date(lastDataDate).getTime()) > 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <header className="border-b border-surface-border pb-5 mb-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tiber-logo.png" alt="Tiber" className="w-9 h-9 object-contain" />
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

        <div className="flex flex-col items-end gap-2">
          <a
            href="https://tibermfg.com"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-brand transition-colors tracking-wide"
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7.5 1.5h3v3M10.5 1.5L6 6M5 2H2a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            tibermfg.com
          </a>

          <div className="text-xs font-mono text-right tracking-wide">
            {isStale ? (
              <div className="flex items-center gap-1.5 justify-end text-yellow-500/80">
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5Zm0 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z"/>
                </svg>
                DATA MAY BE DELAYED — Weekend/Holiday
              </div>
            ) : (
              <div className="text-slate-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand mr-1.5 align-middle" />
                LIVE — FRED / Federal Reserve
              </div>
            )}
            <div className="mt-0.5 text-slate-700">Updated: {date}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
