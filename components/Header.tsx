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
            {/* Tiber [T] logo mark */}
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
              {/* Outer hexagon frame */}
              <path d="M100 10L180 55V145L100 190L20 145V55L100 10Z" stroke="#2a2d3a" strokeWidth="1" />
              {/* TT mark */}
              <g fill="#eaeaea">
                <rect x="45" y="60" width="50" height="8" />
                <rect x="66" y="60" width="8" height="80" />
                <rect x="105" y="60" width="50" height="8" />
                <rect x="126" y="60" width="8" height="80" />
              </g>
              {/* Orange accent line */}
              <line x1="50" y1="155" x2="150" y2="155" stroke="#ff8800" strokeWidth="2" />
              {/* Corner accents */}
              <circle cx="100" cy="10" r="3" fill="#ff8800" />
              <circle cx="180" cy="55" r="2" fill="#2a2d3a" />
              <circle cx="180" cy="145" r="2" fill="#2a2d3a" />
              <circle cx="100" cy="190" r="2" fill="#2a2d3a" />
              <circle cx="20" cy="145" r="2" fill="#2a2d3a" />
              <circle cx="20" cy="55" r="2" fill="#2a2d3a" />
            </svg>
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
