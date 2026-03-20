"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import type { PricePoint } from "@/types";

interface Props {
  data: PricePoint[];
  positive: boolean; // green if positive trend
}

export function TrendSparkline({ data, positive }: Props) {
  const color = positive ? "#22c55e" : "#ef4444";

  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <YAxis domain={["auto", "auto"]} hide />
        <Tooltip
          contentStyle={{
            background: "#141414",
            border: "1px solid #222",
            borderRadius: 4,
            fontSize: 11,
            color: "#e8e8e8",
          }}
          formatter={(v: number) => [v.toLocaleString(), ""]}
          labelFormatter={(l: string) => l}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
