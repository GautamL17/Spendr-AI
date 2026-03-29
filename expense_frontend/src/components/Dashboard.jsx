import React, { useEffect, useState } from "react";
import API from "../api/api";
import useAppStore from "../store/useAppStore";
import { MONTHS, CATEGORY_META } from "../constants/theme";

function PulseRing() {
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      <span className="absolute inline-flex rounded-full h-full w-full bg-sp-primary opacity-60 animate-ping" />
      <span className="relative inline-flex rounded-full w-2 h-2 bg-sp-primary" />
    </span>
  );
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div
      className="flex flex-col gap-2 p-6 rounded-2xl backdrop-blur-sm cursor-default transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--color-sp-surface)",
        border: `1px solid rgba(${accent ?? "167,139,250"},0.18)`,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `rgba(${accent ?? "167,139,250"},0.45)`}
      onMouseLeave={e => e.currentTarget.style.borderColor = `rgba(${accent ?? "167,139,250"},0.18)`}
    >
      <div className="flex justify-between items-center">
        <span className="font-body text-xs text-sp-muted font-medium uppercase tracking-widest">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="font-display text-[32px] font-bold text-sp-text leading-none">
        {value}
      </div>
      {sub && <div className="font-body text-[13px] text-sp-muted">{sub}</div>}
    </div>
  );
}

function AnomalyCard({ anomaly, explanation, index }) {
  const meta = CATEGORY_META[anomaly.category] ?? { emoji: "📦", color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" };
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-2 transition-colors duration-200"
      style={{
        background: "rgba(248,113,113,0.05)",
        border: "1px solid rgba(248,113,113,0.18)",
        animation: `slideIn 0.3s ease ${index * 0.08}s both`,
      }}
    >
      {/* summary row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div
          className="w-[34px] h-[34px] rounded-xl shrink-0 flex items-center justify-center text-base"
          style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
        >
          {meta.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-sp-text mb-0.5">
            {anomaly.category}
          </p>
          <p className="font-body text-xs text-sp-muted m-0">
            ₹{Number(anomaly.current_total).toLocaleString("en-IN")} spent · avg ₹{Number(anomaly.average).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-display font-bold text-[13px] text-sp-error-text bg-sp-error-bg border border-sp-error-border rounded-lg px-2.5 py-0.5">
            +{anomaly.increase_pct}%
          </span>
          <span
            className="text-sp-muted text-xs transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* expanded */}
      {expanded && (
        <div
          className="px-4 py-3.5"
          style={{
            borderTop: "1px solid rgba(248,113,113,0.12)",
            animation: "fadeUp 0.2s ease both",
          }}
        >
          {anomaly.top_expenses?.length > 0 && (
            <div className="mb-3">
              <p className="font-body text-[11px] text-sp-muted mb-2 font-medium uppercase tracking-widest">
                top expenses
              </p>
              <div className="flex flex-col gap-1">
                {anomaly.top_expenses.map((exp, i) => (
                  <div
                    key={i}
                    className="flex justify-between font-body text-[13px] px-2.5 py-1.5 rounded-lg"
                    style={{ background: "var(--color-sp-surface)" }}
                  >
                    <span className="text-sp-text">{exp.title}</span>
                    <span className="text-sp-error-text font-medium">
                      ₹{Number(exp.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {explanation ? (
            <div className="bg-sp-primary/[0.05] border border-sp-primary/[0.15] rounded-xl px-3.5 py-2.5">
              <p className="font-body text-xs text-sp-primary mb-1.5 font-medium">
                ✦ AI explanation
              </p>
              <p className="font-body text-[13px] text-sp-text m-0 leading-relaxed">
                {explanation}
              </p>
            </div>
          ) : (
            <p className="font-body text-xs text-sp-muted m-0">
              loading AI explanation...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AlertItem({ text, index }) {
  return (
    <div
      className="flex gap-3 items-start px-4 py-3 rounded-xl mb-2"
      style={{
        background: "rgba(248,113,113,0.06)",
        border: "1px solid rgba(248,113,113,0.2)",
        animation: `slideIn 0.3s ease ${index * 0.08}s both`,
      }}
    >
      <span className="text-sm mt-0.5">⚡</span>
      <p className="font-body text-sp-error-text text-sm m-0 leading-relaxed">{text}</p>
    </div>
  );
}

function InsightItem({ text, index }) {
  return (
    <div
      className="flex gap-3 items-start px-4 py-3 rounded-xl mb-2"
      style={{
        background: "rgba(52,211,153,0.05)",
        border: "1px solid rgba(52,211,153,0.15)",
        animation: `slideIn 0.3s ease ${index * 0.08}s both`,
      }}
    >
      <span className="text-sm mt-0.5">✦</span>
      <p className="font-body text-sp-secondary text-sm m-0 leading-relaxed">{text}</p>
    </div>
  );
}

function AIAdviceCard({ advice }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 200); }, [advice]);

  return (
    <div
      className="relative rounded-2xl px-7 py-6 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(52,211,153,0.06) 100%)",
        border: "1px solid rgba(167,139,250,0.25)",
      }}
    >
      {/* decorative blob */}
      <div
        className="absolute top-[-30px] right-[-30px] w-[120px] h-[120px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)" }}
      />

      <div className="flex items-center gap-2.5 mb-3.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
          style={{
            background: "rgba(167,139,250,0.15)",
            border: "1px solid rgba(167,139,250,0.3)",
          }}
        >
          ✦
        </div>
        <span className="font-display font-bold text-[15px] text-sp-primary tracking-wide">
          AI Advice
        </span>
        <PulseRing />
      </div>

      <p
        className="font-body text-sp-text text-[15px] leading-relaxed m-0 transition-all duration-500"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(6px)",
        }}
      >
        {advice}
      </p>
    </div>
  );
}

function SectionHeader({ emoji, title, accent }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      <span className="text-base">{emoji}</span>
      <h2
        className="font-display font-bold text-base m-0 tracking-wide"
        style={{ color: accent ?? "var(--color-sp-text)" }}
      >
        {title}
      </h2>
    </div>
  );
}

// Skeleton shimmer card
function SkeletonCard() {
  return (
    <div
      className="h-[110px] rounded-2xl"
      style={{
        background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

export default function Dashboard() {
  const month           = useAppStore((s) => s.month);
  const year            = useAppStore((s) => s.year);
  const setMonthlyTotal = useAppStore((s) => s.setMonthlyTotal);

  const [data, setData]                           = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [anomalies, setAnomalies]                 = useState([]);
  const [anomalyExplanations, setAnomalyExplanations] = useState({});
  const [anomalyLoading, setAnomalyLoading]       = useState(false);

  useEffect(() => {
    setLoading(true); setData(null);
    API.get(`reports/smart-insights/?year=${year}&month=${month}`)
      .then(res => {
        setData(res.data);
        if (res.data.total_spent !== undefined) setMonthlyTotal(Number(res.data.total_spent));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  useEffect(() => {
    setAnomalies([]); setAnomalyExplanations({});
    setAnomalyLoading(true);
    API.get(`reports/anomaly-insights/?year=${year}&month=${month}`)
      .then(res => {
        const raw = res.data.anomalies ?? [];
        setAnomalies(raw);
        const expMap = {};
        raw.forEach(a => { expMap[a.category] = res.data.ai_explanation ?? ""; });
        setAnomalyExplanations(expMap);
      })
      .catch(() => {})
      .finally(() => setAnomalyLoading(false));
  }, [month, year]);

  return (
    <>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 99px; }
      `}</style>

      <div className="min-h-screen bg-sp-bg pb-16 relative overflow-hidden">

        {/* ambient blobs */}
        <div
          className="fixed top-[-180px] right-[-120px] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="fixed bottom-[-200px] left-[-100px] w-[440px] h-[440px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)" }}
        />

        <div className="max-w-[900px] mx-auto px-6 py-10">

          {/* heading */}
          <div className="mb-9" style={{ animation: "fadeUp 0.5s ease both" }}>
            <h1 className="font-display font-extrabold text-[38px] text-sp-text mb-1.5 tracking-tight leading-tight">
              your money,{" "}
              <span style={{ background: "linear-gradient(90deg, #A78BFA, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                decoded.
              </span>
            </h1>
            <p className="font-body text-sp-muted text-[15px] m-0">
              {MONTHS.find(m => m.v === month)?.l} {year} · smart insights powered by AI
            </p>
          </div>

          {/* skeleton */}
          {loading && (
            <div className="grid grid-cols-3 gap-4 mb-7">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          )}

          {data && (
            <>
              {/* stat cards */}
              <div
                className="grid grid-cols-3 gap-4 mb-7"
                style={{ animation: "fadeUp 0.5s ease 0.1s both" }}
              >
                <StatCard label="Predicted Spend" value={`₹${Number(data.prediction).toLocaleString("en-IN")}`} sub="next 30 days forecast" accent="167,139,250" icon="📈" />
                <StatCard label="Anomalies" value={anomalyLoading ? "..." : anomalies.length} sub={anomalies.length === 0 ? "spending looks normal" : "categories spiked"} accent="248,113,113" icon="⚡" />
                <StatCard label="Insights" value={data.insights.length} sub="patterns detected" accent="52,211,153" icon="✦" />
              </div>

              {/* anomalies + insights */}
              <div
                className="grid grid-cols-2 gap-4 mb-5"
                style={{ animation: "fadeUp 0.5s ease 0.2s both" }}
              >
                <div
                  className="rounded-2xl p-6"
                  style={{ background: "var(--color-sp-surface)", border: "1px solid rgba(248,113,113,0.15)" }}
                >
                  <SectionHeader emoji="⚡" title="Anomalies" accent="#F87171" />
                  {anomalyLoading && (
                    <div
                      className="h-[60px] rounded-xl"
                      style={{
                        background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, var(--color-sp-border) 50%, rgba(255,255,255,0.03) 75%)",
                        backgroundSize: "600px 100%",
                        animation: "shimmer 1.5s infinite",
                      }}
                    />
                  )}
                  {!anomalyLoading && anomalies.length === 0 && (
                    <p className="font-body text-sp-muted text-sm m-0">spending looks normal this month ✓</p>
                  )}
                  {!anomalyLoading && anomalies.map((a, i) => (
                    <AnomalyCard key={a.category} anomaly={a} explanation={anomalyExplanations[a.category]} index={i} />
                  ))}
                  {data.alerts?.length > 0 && (
                    <div className={anomalies.length > 0 ? "mt-3" : ""}>
                      {data.alerts.map((a, i) => <AlertItem key={i} text={a} index={i} />)}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-2xl p-6"
                  style={{ background: "var(--color-sp-surface)", border: "1px solid rgba(52,211,153,0.15)" }}
                >
                  <SectionHeader emoji="✦" title="Insights" accent="#34D399" />
                  {data.insights.length === 0
                    ? <p className="font-body text-sp-muted text-sm m-0">no insights yet — add more expenses!</p>
                    : data.insights.map((ins, i) => <InsightItem key={i} text={ins} index={i} />)
                  }
                </div>
              </div>

              {/* AI advice */}
              <div style={{ animation: "fadeUp 0.5s ease 0.3s both" }}>
                <AIAdviceCard advice={data.ai_advice} />
              </div>
            </>
          )}

          {!loading && !data && (
            <div className="text-center py-16 font-body text-sp-muted text-[15px]">
              couldn't load data. check your connection and try again.
            </div>
          )}
        </div>
      </div>
    </>
  );
}