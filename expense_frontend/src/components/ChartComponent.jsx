import React, { useEffect, useState } from "react";
import API from "../api/api";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import useAppStore from "../store/useAppStore";
import { CHART_PALETTE, CATEGORY_META, DEFAULT_CATEGORY_META, MONTHS, FONTS } from "../constants/theme";

// derive emoji map from the single source of truth in theme.js
const CATEGORY_EMOJI = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([k, v]) => [k, v.emoji])
);

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div style={{
      background: "var(--color-sp-topbar)",
      border: `1px solid ${p.fill}44`,
      borderRadius: 12,
      padding: "10px 16px",
      fontFamily: "'DM Sans', sans-serif",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[name] ?? "💸"}</span>
        <span style={{ color: "var(--color-sp-text)", fontWeight: 500, fontSize: 14 }}>{name}</span>
      </div>
      <div style={{ color: p.fill, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, marginTop: 4 }}>
        ₹{Number(value).toLocaleString("en-IN")}
      </div>
    </div>
  );
}

function CustomLegend({ payload, total }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 8 }}>
      {payload.map((entry, i) => {
        const pct = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10, padding: "8px 12px",
            background: `${entry.color}0d`,
            border: `1px solid ${entry.color}22`,
            borderRadius: 10,
            transition: "border-color 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "var(--color-sp-text2)" }}>
                {CATEGORY_EMOJI[entry.value] ?? "💸"} {entry.value}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "var(--color-sp-muted)" }}>{pct}%</span>
              <span style={{ fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: entry.color }}>
                ₹{Number(entry.payload.value).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CenterLabel({ cx, cy, total }) {
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize={12} fill="#64748B">total spent</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontFamily="'Syne', sans-serif" fontWeight={700} fontSize={22} fill="var(--color-sp-text)">
        ₹{Number(total).toLocaleString("en-IN")}
      </text>
    </g>
  );
}

export default function ChartComponent() {
  const month          = useAppStore((s) => s.month);
  const year           = useAppStore((s) => s.year);
  const monthlyTotal   = useAppStore((s) => s.monthlyTotal);
  const setMonthlyTotal = useAppStore((s) => s.setMonthlyTotal);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    setLoading(true);
    API.get(`reports/dashboard/?year=${year}&month=${month}`)
      .then(res => {
        const formatted = res.data.category_breakdown.map(item => ({
          name: item.category,
          value: item.total,
        }));
        setData(formatted);
        // reports/dashboard/ returns total_spent — use it as the canonical total
        if (res.data.total_spent !== undefined) {
          setMonthlyTotal(Number(res.data.total_spent));
        }
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [month, year]);

  // use store total so it always matches Dashboard and ExpenseList
  const total = monthlyTotal;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
      `}</style>

      <div style={{
        background: "var(--color-sp-surface)",
        border: "1px solid rgba(167,139,250,0.18)",
        borderRadius: 24,
        padding: "28px",
        backdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden",
        animation: "fadeUp 0.5s ease both",
      }}>

        {/* ambient blob */}
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800, fontSize: 20,
              color: "var(--color-sp-text)", margin: "0 0 4px",
              letterSpacing: "-0.02em",
            }}>Category Breakdown</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--color-sp-muted)", margin: 0 }}>
              {MONTHS.find(m => m.v === month)?.l} {year} · {data.length} categories
            </p>
          </div>
        </div>

        {/* shimmer skeleton */}
        {loading && (
          <div style={{
            height: 300, borderRadius: 16,
            background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
            backgroundSize: "800px 100%",
            animation: "shimmer 1.5s infinite",
          }} />
        )}

        {!loading && data.length === 0 && (
          <div style={{
            textAlign: "center", padding: "50px 0",
            fontFamily: "'DM Sans', sans-serif", color: "var(--color-sp-muted)", fontSize: 14,
          }}>no expenses logged this month yet</div>
        )}

        {!loading && data.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center" }}>

            {/* donut chart */}
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={72}
                    outerRadius={110}
                    paddingAngle={3}
                    onMouseEnter={(_, i) => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    strokeWidth={0}
                  >
                    {data.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                        style={{ cursor: "pointer", transition: "opacity 0.2s, transform 0.2s" }}
                      />
                    ))}
                    <CenterLabel cx={140} cy={140} total={total} />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* legend */}
            <CustomLegend
              payload={data.map((d, i) => ({
                value: d.name,
                color: CHART_PALETTE[i % CHART_PALETTE.length],
                payload: d,
              }))}
              total={total}
            />
          </div>
        )}
      </div>
    </>
  );
}