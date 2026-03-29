import React, { useState } from "react";
import useAppStore from "../store/useAppStore";
import { MONTHS } from "../constants/theme";

function buildCSV(expenses) {
  const headers = ["Date", "Title", "Category", "Amount (₹)"];
  const rows = expenses.map(e => [
    e.date,
    `"${String(e.title).replace(/"/g, '""')}"`,
    e.category,
    Number(e.amount).toFixed(2),
  ]);
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});
  const lines = [
    headers.join(","),
    ...rows.map(r => r.join(",")),
    "",
    "Summary",
    `Total,,,${total.toFixed(2)}`,
    "",
    "Category Breakdown",
    ...Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt]) => `${cat},,,${amt.toFixed(2)}`),
  ];
  return lines.join("\n");
}

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton() {
  const expenses   = useAppStore((s) => s.expenses);
  const month      = useAppStore((s) => s.month);
  const year       = useAppStore((s) => s.year);
  const [state, setState] = useState("idle"); // idle | success | empty

  const monthLabel = MONTHS.find(m => m.v === month)?.l ?? month;

  const handleExport = () => {
    if (!expenses.length) {
      setState("empty");
      setTimeout(() => setState("idle"), 2000);
      return;
    }
    triggerDownload(buildCSV(expenses), `spendr_${monthLabel.toLowerCase()}_${year}.csv`);
    setState("success");
    setTimeout(() => setState("idle"), 2500);
  };

  const stateClasses = {
    idle:    "bg-sp-secondary/10 border border-sp-secondary/25 text-sp-secondary hover:bg-sp-secondary/20 hover:border-sp-secondary/45",
    success: "bg-sp-secondary/20 border border-sp-secondary/50 text-sp-secondary",
    empty:   "bg-sp-error-bg border border-sp-error-border text-sp-error-text",
  };

  const labels = {
    idle:    `↓ export ${monthLabel}`,
    success: "✦ downloaded!",
    empty:   "no data to export",
  };

  return (
    <button
      onClick={handleExport}
      className={`font-display font-bold text-[13px] px-[18px] py-[9px] rounded-xl cursor-pointer transition-all duration-200 whitespace-nowrap ${stateClasses[state]}`}
    >
      {labels[state]}
    </button>
  );
}