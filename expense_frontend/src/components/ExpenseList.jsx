import React, { useEffect, useState } from "react";
import API from "../api/api";
import useAppStore from "../store/useAppStore";
import { CATEGORY_META, DEFAULT_CATEGORY_META, MONTHS } from "../constants/theme";
import RecurringDetector from "./RecurringDetector";
import ConfirmDialog from "./ConfirmDialog";

const DEFAULT_META = DEFAULT_CATEGORY_META;
const SORT_OPTIONS = [
  { label: "Newest",  value: "-date"   },
  { label: "Oldest",  value: "date"    },
  { label: "Highest", value: "-amount" },
  { label: "Lowest",  value: "amount"  },
];
const ALL_CATEGORIES = ["ALL", ...Object.keys(CATEGORY_META)];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── CategoryPill ─────────────────────────────────────────────────────────────
function CategoryPill({ cat, active, onClick }) {
  const meta = CATEGORY_META[cat] ?? DEFAULT_META;
  return (
    <button
      onClick={onClick}
      className="font-body text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 whitespace-nowrap"
      style={{
        border: `1px solid ${active ? meta.border : "var(--color-sp-border)"}`,
        background: active ? meta.bg : "transparent",
        color: active ? meta.color : "var(--color-sp-muted)",
      }}
    >
      {cat === "ALL" ? "✦ All" : `${meta.emoji} ${cat}`}
    </button>
  );
}

// ─── NLInputBar ───────────────────────────────────────────────────────────────
function NLInputBar({ onParsed }) {
  const [text, setText]       = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError]     = useState("");

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true); setError("");
    try {
      const res = await API.post("reports/parse-natural/", { text });
      if (res.data.error) setError("couldn't parse that — try being more specific");
      else { onParsed(res.data); setText(""); }
    } catch { setError("parsing failed, try again"); }
    finally { setParsing(false); }
  };

  return (
    <div
      className="rounded-2xl px-4 py-3.5 mb-4"
      style={{
        background: "rgba(167,139,250,0.05)",
        border: "1px solid rgba(167,139,250,0.2)",
        animation: "fadeUp 0.2s ease both",
      }}
    >
      <p className="font-body text-[11px] text-sp-primary m-0 mb-2.5 font-medium">
        ✦ describe your expense in plain language
      </p>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleParse()}
          placeholder='"spent 450 on lunch with team yesterday"'
          disabled={parsing}
          className="flex-1 px-3.5 py-2.5 rounded-xl font-body text-[13px] text-sp-text outline-none transition-colors duration-150"
          style={{
            background: "var(--color-sp-surface2)",
            border: "1px solid rgba(167,139,250,0.25)",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(167,139,250,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(167,139,250,0.25)"}
        />
        <button
          onClick={handleParse}
          disabled={parsing || !text.trim()}
          className="px-4 py-2.5 rounded-xl font-display font-bold text-[13px] text-sp-primary whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "rgba(167,139,250,0.18)",
            border: "1px solid rgba(167,139,250,0.35)",
          }}
        >
          {parsing ? "parsing..." : "✦ parse"}
        </button>
      </div>
      {error && <p className="font-body text-xs text-sp-error-text mt-2 mb-0">{error}</p>}
    </div>
  );
}

// ─── ExpenseForm ──────────────────────────────────────────────────────────────
function ExpenseForm({ mode = "add", initial = null, onSubmit, onClose }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(initial ?? {
    title: "", amount: "", category: "FOOD",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [nlMode, setNlMode]         = useState(!isEdit);
  const [aiCategory, setAiCategory] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const [changed, setChanged]       = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setChanged(true); };

  const debouncedTitle = useDebounce(form.title, 600);
  useEffect(() => {
    if (!debouncedTitle.trim() || debouncedTitle.length < 3) { setAiCategory(null); return; }
    if (isEdit && debouncedTitle === initial?.title) return;
    setSuggesting(true);
    API.post("reports/suggest-category/", { title: debouncedTitle })
      .then(res => {
        if (res.data.suggested_category && res.data.suggested_category !== form.category)
          setAiCategory(res.data.suggested_category);
      })
      .catch(() => {})
      .finally(() => setSuggesting(false));
  }, [debouncedTitle]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.amount) { setError("title and amount are required"); return; }
    if (isEdit && !changed) { onClose(); return; }
    setLoading(true); setError("");
    try {
      await onSubmit({ ...form, amount: parseFloat(form.amount) });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail ?? "something went wrong, try again");
      setLoading(false);
    }
  };

  const accent      = isEdit ? "251,191,36"  : "167,139,250";
  const accentHex   = isEdit ? "#FBBF24"     : "#A78BFA";
  const accentMuted = isEdit ? "#FCD34D"     : "#C4B5FD";

  const inputBase = "w-full px-3.5 py-2.5 rounded-xl font-body text-sm text-sp-text outline-none transition-colors duration-150";
  const inputStyle = { background: "var(--color-sp-surface2)", border: "1px solid var(--color-sp-border)" };

  return (
    <div
      className="rounded-2xl p-6 backdrop-blur-xl"
      style={{
        background: "var(--color-sp-topbar)",
        border: `1px solid rgba(${accent},0.25)`,
        animation: "fadeUp 0.25s ease both",
      }}
    >
      {/* header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display font-bold text-base text-sp-text m-0">
            {isEdit ? "edit expense" : "add expense"}
          </h3>
          {isEdit && (
            <span
              className="font-body text-[10px] font-medium px-2 py-0.5 rounded"
              style={{ background: `rgba(${accent},0.1)`, color: accentHex, border: `1px solid rgba(${accent},0.25)` }}
            >
              editing
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setNlMode(n => !n)}
            className="font-body text-[11px] font-medium px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150"
            style={{
              background: nlMode ? `rgba(${accent},0.2)` : "var(--color-sp-surface)",
              border: `1px solid ${nlMode ? `rgba(${accent},0.35)` : "rgba(255,255,255,0.08)"}`,
              color: nlMode ? accentMuted : "var(--color-sp-muted)",
            }}
          >
            ✦ AI {isEdit ? "re-parse" : "parse"}
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[13px] text-sp-muted cursor-pointer transition-colors duration-150 hover:text-sp-text"
            style={{ background: "transparent", border: "1px solid var(--color-sp-border)" }}
          >
            ✕
          </button>
        </div>
      </div>

      {nlMode && (
        <NLInputBar onParsed={(parsed) => {
          setForm({ title: parsed.title ?? form.title, amount: parsed.amount ?? form.amount, category: parsed.category ?? form.category, date: parsed.date ?? form.date });
          setChanged(true); setNlMode(false);
        }} />
      )}

      {isEdit && changed && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3.5"
          style={{ background: `rgba(${accent},0.06)`, border: `1px solid rgba(${accent},0.15)` }}
        >
          <span className="text-xs">✎</span>
          <p className="font-body text-xs m-0" style={{ color: accentHex }}>
            unsaved changes — click save to update
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 mb-3.5">
        {/* title */}
        <div className="col-span-2">
          <label className="font-body text-xs text-sp-muted mb-1.5 block">title</label>
          <div className="relative">
            <input
              value={form.title}
              onChange={e => { set("title", e.target.value); setAiCategory(null); }}
              placeholder="e.g. lunch with friends"
              className={inputBase}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = `rgba(${accent},0.5)`}
              onBlur={e => e.target.style.borderColor = "var(--color-sp-border)"}
            />
            {aiCategory && !suggesting && (
              <div
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-lg"
                style={{ background: `rgba(${accent},0.15)`, border: `1px solid rgba(${accent},0.3)`, animation: "fadeUp 0.2s ease both" }}
              >
                <span className="font-body text-[11px] whitespace-nowrap" style={{ color: accentHex }}>
                  ✦ {CATEGORY_META[aiCategory]?.emoji} {aiCategory}?
                </span>
                <button onClick={() => { set("category", aiCategory); setAiCategory(null); }}
                  className="font-body text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer border-none"
                  style={{ background: `rgba(${accent},0.25)`, color: accentMuted }}>yes</button>
                <button onClick={() => setAiCategory(null)}
                  className="text-sp-muted text-xs px-0.5 bg-transparent border-none cursor-pointer">✕</button>
              </div>
            )}
            {suggesting && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-[11px] text-sp-muted">
                ✦ detecting...
              </span>
            )}
          </div>
        </div>

        {/* amount */}
        <div>
          <label className="font-body text-xs text-sp-muted mb-1.5 block">amount (₹)</label>
          <input
            type="number" value={form.amount}
            onChange={e => set("amount", e.target.value)}
            placeholder="0"
            className={inputBase}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = `rgba(${accent},0.5)`}
            onBlur={e => e.target.style.borderColor = "var(--color-sp-border)"}
          />
        </div>

        {/* date */}
        <div>
          <label className="font-body text-xs text-sp-muted mb-1.5 block">date</label>
          <input
            type="date" value={form.date}
            onChange={e => set("date", e.target.value)}
            className={`${inputBase} [color-scheme:dark]`}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = `rgba(${accent},0.5)`}
            onBlur={e => e.target.style.borderColor = "var(--color-sp-border)"}
          />
        </div>

        {/* category */}
        <div className="col-span-2">
          <label className="font-body text-xs text-sp-muted mb-1.5 block">
            category
            {suggesting && (
              <span className="ml-1.5 text-[10px]" style={{ color: accentHex }}>✦ AI detecting...</span>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(CATEGORY_META).map(cat => {
              const m = CATEGORY_META[cat];
              const active = form.category === cat;
              return (
                <button key={cat}
                  onClick={() => { set("category", cat); setAiCategory(null); }}
                  className="font-body text-xs font-medium px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150"
                  style={{
                    border: `1px solid ${active ? m.border : "rgba(255,255,255,0.07)"}`,
                    background: active ? m.bg : "transparent",
                    color: active ? m.color : "var(--color-sp-muted)",
                  }}
                >
                  {m.emoji} {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && <p className="font-body text-[13px] text-sp-error-text mb-3">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all duration-150 disabled:cursor-not-allowed"
          style={{
            background: loading ? `rgba(${accent},0.1)` : `rgba(${accent},0.18)`,
            border: `1px solid rgba(${accent},0.35)`,
            color: accentMuted,
          }}
        >
          {loading ? (isEdit ? "saving..." : "adding...") : (isEdit ? "✦ save changes" : "✦ add expense")}
        </button>
        {isEdit && (
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-body font-medium text-sm text-sp-muted cursor-pointer transition-all duration-150 hover:text-sp-text"
            style={{ background: "transparent", border: "1px solid var(--color-sp-border)" }}
          >
            cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ExpenseRow ───────────────────────────────────────────────────────────────
function ExpenseRow({ exp, onDelete, onEdit, showMonth = false, style: animStyle }) {
  const meta      = CATEGORY_META[exp.category] ?? DEFAULT_META;
  const editingId = useAppStore((s) => s.editingId);
  const openEdit  = useAppStore((s) => s.openEdit);
  const closeEdit = useAppStore((s) => s.closeEdit);
  const editing   = editingId === exp.id;

  const [hovered, setHovered]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try { await onDelete(exp.id); } catch { setDeleting(false); }
  };

  const dateStr = new Date(exp.date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div style={animStyle}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-4 px-[18px] py-3.5 transition-all duration-200"
        style={{
          background: editing ? "rgba(251,191,36,0.04)" : hovered ? "var(--color-sp-surface)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${editing ? "rgba(251,191,36,0.25)" : hovered ? meta.border : "rgba(255,255,255,0.05)"}`,
          borderRadius: editing ? "16px 16px 0 0" : 16,
          opacity: deleting ? 0.4 : 1,
          cursor: "default",
        }}
      >
        {/* category icon */}
        <div
          className="w-[42px] h-[42px] rounded-xl shrink-0 flex items-center justify-center text-lg transition-all duration-200"
          style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
        >
          {meta.emoji}
        </div>

        {/* title + date */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[15px] text-sp-text mb-0.5 truncate">
            {exp.title}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="font-body text-xs text-sp-muted m-0">{dateStr}</p>
            {showMonth && (
              <span className="font-body text-[10px] font-medium px-1.5 py-0.5 rounded bg-sp-primary-subtle text-sp-primary border border-sp-badge-border">
                {new Date(exp.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* category badge */}
        <span
          className="font-body text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap"
          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
        >
          {exp.category}
        </span>

        {/* amount */}
        <div
          className="font-display font-bold text-base min-w-[80px] text-right"
          style={{ color: meta.color }}
        >
          ₹{Number(exp.amount).toLocaleString("en-IN")}
        </div>

        {/* actions */}
        <div
          className="flex gap-1.5 shrink-0 transition-opacity duration-150"
          style={{ opacity: hovered || editing ? 1 : 0 }}
        >
          <button
            onClick={() => editing ? closeEdit() : openEdit(exp.id)}
            className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[13px] cursor-pointer transition-all duration-150"
            style={{
              background: editing ? "rgba(251,191,36,0.15)" : "var(--color-sp-surface)",
              border: `1px solid ${editing ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.08)"}`,
              color: editing ? "#FBBF24" : "var(--color-sp-muted)",
            }}
            title="edit expense"
          >
            ✎
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[13px] text-sp-error-text bg-sp-error-bg border border-sp-error-border cursor-pointer disabled:cursor-not-allowed transition-all duration-150"
            title="delete expense"
          >
            ✕
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="delete expense?"
        message={`"${exp.title}" will be permanently removed. this cannot be undone.`}
        confirmLabel="yes, delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* inline edit */}
      {editing && (
        <div
          className="overflow-hidden"
          style={{
            border: "1px solid rgba(251,191,36,0.25)",
            borderTop: "none",
            borderRadius: "0 0 16px 16px",
            animation: "slideDown 0.25s ease both",
          }}
        >
          <ExpenseForm
            mode="edit"
            initial={{ title: exp.title, amount: String(exp.amount), category: exp.category, date: exp.date }}
            onSubmit={async (data) => { await onEdit(exp.id, data); }}
            onClose={closeEdit}
          />
        </div>
      )}
    </div>
  );
}

// ─── ExpenseList ──────────────────────────────────────────────────────────────
export default function ExpenseList() {
  const month        = useAppStore((s) => s.month);
  const year         = useAppStore((s) => s.year);
  const expenses     = useAppStore((s) => s.expenses);
  const setExpenses  = useAppStore((s) => s.setExpenses);
  const showAddForm  = useAppStore((s) => s.showAddForm);
  const openAddForm  = useAppStore((s) => s.openAddForm);
  const closeAddForm = useAppStore((s) => s.closeAddForm);

  const [loading, setLoading]             = useState(true);
  const [category, setCategory]           = useState("ALL");
  const [sort, setSort]                   = useState("-date");
  const [search, setSearch]               = useState("");
  const [searchMode, setSearchMode]       = useState("month");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const isAllMode       = searchMode === "all" && search.trim().length > 0;
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (searchMode === "all") return;
    setLoading(true); setExpenses([]);
    const pad = (n) => String(n).padStart(2, "0");
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    params.set("ordering", sort);
    params.set("date__gte", `${year}-${pad(month)}-01`);
    params.set("date__lte", `${year}-${pad(month)}-31`);
    API.get(`expenses/?${params}`)
      .then(res => { setExpenses(res.data.results || res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [category, sort, month, year, searchMode]);

  useEffect(() => {
    if (searchMode !== "all" || !debouncedSearch.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    const params = new URLSearchParams();
    params.set("search", debouncedSearch.trim());
    params.set("ordering", sort);
    if (category !== "ALL") params.set("category", category);
    API.get(`expenses/?${params}`)
      .then(res => setSearchResults(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setSearchLoading(false));
  }, [debouncedSearch, searchMode, sort, category]);

  const displayList = isAllMode
    ? searchResults.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
    : expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  const total = displayList.reduce((s, e) => s + Number(e.amount), 0);

  const switchMode = (mode) => { setSearchMode(mode); setSearch(""); setSearchResults([]); };

  const handleDelete = async (id) => {
    await API.delete(`expenses/${id}/`);
    setExpenses(expenses.filter(e => e.id !== id));
    setSearchResults(prev => prev.filter(e => e.id !== id));
  };
  const handleAdd  = (newExp) => setExpenses([newExp, ...expenses]);
  const handleEdit = async (id, data) => {
    const res = await API.put(`expenses/${id}/`, data);
    setExpenses(expenses.map(e => e.id === id ? res.data : e));
    setSearchResults(prev => prev.map(e => e.id === id ? res.data : e));
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
        input::placeholder { color: #334155; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>

      <div
        className="relative rounded-3xl p-7 overflow-hidden"
        style={{
          background: "var(--color-sp-surface)",
          border: "1px solid rgba(167,139,250,0.15)",
          animation: "fadeUp 0.5s ease both",
        }}
      >
        {/* decorative blob */}
        <div
          className="absolute bottom-[-80px] right-[-80px] w-[220px] h-[220px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)" }}
        />

        {/* header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="font-display font-extrabold text-xl text-sp-text mb-1 tracking-tight">
              Expenses
            </h2>
            <p className="font-body text-[13px] text-sp-muted m-0">
              {isAllMode ? (
                <><span className="text-sp-primary">{displayList.length} results</span> across all time · ₹{total.toLocaleString("en-IN")} total</>
              ) : (
                <>{MONTHS.find(m => m.v === month)?.l} {year} · {displayList.length} entries · <span className="text-sp-primary">₹{total.toLocaleString("en-IN")}</span> total</>
              )}
            </p>
          </div>
          <button
            onClick={() => showAddForm ? closeAddForm() : openAddForm()}
            className="font-display font-bold text-[13px] px-[18px] py-[9px] rounded-xl cursor-pointer transition-all duration-200"
            style={{
              background: showAddForm ? "rgba(248,113,113,0.1)" : "rgba(167,139,250,0.15)",
              border: `1px solid ${showAddForm ? "rgba(248,113,113,0.3)" : "rgba(167,139,250,0.3)"}`,
              color: showAddForm ? "#F87171" : "#C4B5FD",
            }}
          >
            {showAddForm ? "✕ cancel" : "+ add new"}
          </button>
        </div>

        {/* add form */}
        {showAddForm && (
          <div className="mb-5">
            <ExpenseForm
              mode="add"
              onSubmit={async (data) => { const res = await API.post("expenses/", data); handleAdd(res.data); }}
              onClose={closeAddForm}
            />
          </div>
        )}

        <RecurringDetector />

        {/* search + sort */}
        <div className="flex gap-2.5 mb-4 flex-wrap">
          {/* search input */}
          <div className="flex-1 min-w-[220px] relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-sp-muted transition-colors duration-200">
              ⌕
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchMode === "all" ? "search all expenses..." : "search this month..."}
              className="w-full pl-8 pr-16 py-2 rounded-xl font-body text-[13px] text-sp-text outline-none transition-colors duration-200"
              style={{
                background: "var(--color-sp-surface2)",
                border: `1px solid ${searchMode === "all" && search ? "rgba(167,139,250,0.35)" : "rgba(255,255,255,0.08)"}`,
                boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(167,139,250,0.4)"}
              onBlur={e => e.target.style.borderColor = searchMode === "all" && search ? "rgba(167,139,250,0.35)" : "rgba(255,255,255,0.08)"}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 font-body text-[11px] text-sp-muted px-1.5 py-0.5 rounded-md cursor-pointer border-none bg-sp-border"
              >
                ✕
              </button>
            )}
          </div>

          {/* mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-sp-border shrink-0">
            {[{ mode: "month", label: "this month" }, { mode: "all", label: "all time" }].map((m, idx) => (
              <button
                key={m.mode}
                onClick={() => switchMode(m.mode)}
                className="font-body text-xs font-medium px-3 py-1.5 cursor-pointer transition-all duration-150 border-none"
                style={{
                  background: searchMode === m.mode ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.02)",
                  color: searchMode === m.mode ? "#C4B5FD" : "var(--color-sp-muted)",
                  borderRight: idx === 0 ? "1px solid var(--color-sp-border)" : "none",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* sort */}
          <div className="flex gap-1">
            {SORT_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className="font-body text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 border-none"
                style={{
                  background: sort === s.value ? "rgba(167,139,250,0.2)" : "var(--color-sp-surface)",
                  color: sort === s.value ? "#C4B5FD" : "var(--color-sp-muted)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* all-time banner */}
        {searchMode === "all" && (
          <div className="flex items-center justify-between px-3.5 py-2 mb-3.5 rounded-xl bg-sp-primary/[0.06] border border-sp-primary/[0.15]">
            <span className="font-body text-xs text-sp-primary">
              ✦ searching across all time — not limited to {MONTHS.find(m => m.v === month)?.l}
            </span>
            <button
              onClick={() => switchMode("month")}
              className="font-body text-[11px] text-sp-muted bg-transparent border-none cursor-pointer hover:text-sp-text transition-colors duration-150"
            >
              back to month view
            </button>
          </div>
        )}

        {/* category pills */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {ALL_CATEGORIES.map(cat => (
            <CategoryPill key={cat} cat={cat} active={category === cat} onClick={() => setCategory(cat)} />
          ))}
        </div>

        {/* skeleton */}
        {(loading || searchLoading) && (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-[68px] rounded-2xl"
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
                  backgroundSize: "800px 100%",
                  animation: `shimmer 1.5s ${i * 0.1}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        {/* empty state */}
        {!loading && !searchLoading && displayList.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🌚</div>
            <p className="font-body text-sp-muted text-sm m-0">
              {search
                ? `no results for "${search}"${searchMode === "all" ? " across all time" : " this month"}`
                : "no expenses here yet"}
            </p>
          </div>
        )}

        {/* expense rows */}
        {!loading && !searchLoading && displayList.length > 0 && (
          <div className="flex flex-col gap-2">
            {displayList.map((exp, i) => (
              <ExpenseRow
                key={exp.id}
                exp={exp}
                onDelete={handleDelete}
                onEdit={handleEdit}
                showMonth={isAllMode}
                style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}