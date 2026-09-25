"use client";

import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  getChargerPerformance,
  type ApiChargerPerformance,
} from "@/lib/actions/dashboard-actions";
import { getBranches } from "@/lib/actions/branch-actions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

interface BranchOption {
  id: string;
  name: string;
}

function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const d = new Date(now);
  d.setDate(now.getDate() - now.getDay());
  return { start: d.toISOString().split("T")[0], end: today };
}

function formatPeriodLabel(periodStart: string): string {
  // Handle "HH:MM" format from API
  const timeMatch = periodStart.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const mins = parseInt(timeMatch[2], 10);
    if (mins === 0) {
      if (hour === 0) return "12am";
      if (hour < 12) return `${hour}am`;
      if (hour === 12) return "12pm";
      return `${hour - 12}pm`;
    }
    return periodStart;
  }
  // Fallback: try parsing as full datetime
  const d = new Date(periodStart);
  if (isNaN(d.getTime())) return periodStart;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateLabel(start: string, end: string): string {
  if (!start && !end) return "";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const s = start ? new Date(start + "T00:00:00").toLocaleDateString("en-US", opts) : "";
  const e = end ? new Date(end + "T00:00:00").toLocaleDateString("en-US", opts) : "";
  return s === e ? s : `${s} – ${e}`;
}

export default function ChargerPerformance() {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const [pendingRange, setPendingRange] = useState(getCurrentWeekRange);
  const [appliedRange, setAppliedRange] = useState(getCurrentWeekRange);
  const canApply = pendingRange.start !== "" && pendingRange.end !== "";

  const [data, setData] = useState<ApiChargerPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBranches({ page: 1, limit: 999, status: "All", search: "" })
      .then((res) =>
        setBranches(
          res.branches.map((b) => ({ id: b.id!, name: b.station_name }))
        )
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const branchId = selectedBranch !== "all" ? selectedBranch : undefined;
    getChargerPerformance(appliedRange.start, appliedRange.end, branchId)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [appliedRange.start, appliedRange.end, selectedBranch]);

  const graphLabels =
    data?.kwh_consumption_graph?.map((s) => formatPeriodLabel(s.period_start)) ??
    [];
  const graphValues = data?.kwh_consumption_graph?.map((s) => s.kwh) ?? [];
  const yMax = graphValues.length > 0 ? Math.ceil(Math.max(...graphValues) * 1.2 / 20) * 20 : 120;
  const rangeLabel = formatDateLabel(appliedRange.start, appliedRange.end);

  const chartData = {
    labels: graphLabels,
    datasets: [
      {
        data: graphValues,
        fill: true,
        tension: 0.4,
        borderColor: "#3b82f6",
        borderWidth: 2,
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280);
          gradient.addColorStop(0, "rgba(59,130,246,0.25)");
          gradient.addColorStop(1, "rgba(59,130,246,0.02)");
          return gradient;
        },
        pointBackgroundColor: "#3b82f6",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) =>
            ` ${ctx.parsed.y} kWh`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: { color: "#9ca3af", font: { size: 11 } },
        border: { display: false },
      },
      y: {
        min: 0,
        max: yMax,
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: {
          color: "#9ca3af",
          font: { size: 11 },
          callback: (v: number | string) => `${v} kWh`,
          stepSize: 20,
        },
        border: { display: false },
        title: {
          display: true,
          text: "Energy (kWh)",
          color: "#9ca3af",
          font: { size: 11 },
        },
      },
    },
  };

  const summary = data?.charger_summary;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-36" />
            <div className="h-8 bg-gray-200 rounded w-28" />
            <div className="h-8 bg-gray-200 rounded w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {/* charging pile icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 2h10v20H7z" /><path d="M17 6h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" /><path d="M11 9l-2 4h4l-2 4" />
          </svg>
          Charger Performance
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={pendingRange.start}
            onChange={(e) =>
              setPendingRange((r) => ({ ...r, start: e.target.value }))
            }
            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-400">–</span>
          <input
            type="date"
            value={pendingRange.end}
            min={pendingRange.start}
            onChange={(e) =>
              setPendingRange((r) => ({ ...r, end: e.target.value }))
            }
            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setAppliedRange(pendingRange)}
            disabled={!canApply}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Stats row — 5 blocks */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total chargers */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <p className="text-xs text-gray-500 font-medium">Total chargers</p>
          <p className="text-3xl font-bold text-gray-900">
            {summary?.total_chargers !== undefined ? summary.total_chargers.toLocaleString() : "—"}
          </p>
          <p className="text-xs text-gray-400">across all branches</p>
        </div>

        {/* Total guns */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <p className="text-xs text-gray-500 font-medium">Total guns</p>
          <p className="text-3xl font-bold text-gray-900">
            {summary?.total_guns !== undefined ? summary.total_guns.toLocaleString() : "—"}
          </p>
          <p className="text-xs text-gray-400">connectors total</p>
        </div>

        {/* Guns in use */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Guns in use
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {summary?.in_use_guns !== undefined ? summary.in_use_guns.toLocaleString() : "—"}
          </p>
          <p className="text-xs text-green-600 font-medium">
            ↗ {summary?.in_use_guns_percent !== undefined ? summary.in_use_guns_percent : "—"}% utilization
          </p>
        </div>

        {/* Available guns */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
            </svg>
            Available guns
          </div>
          <p className="text-3xl font-bold text-green-600">
            {summary?.available_guns !== undefined ? summary.available_guns.toLocaleString() : "—"}
          </p>
          <p className="text-xs text-gray-400">{summary?.available_guns_percent !== undefined ? summary.available_guns_percent : "—"}% of fleet</p>
        </div>

        {/* Offline / error */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Offline / error
          </div>
          <p className="text-3xl font-bold text-red-500">
            {summary?.offline_chargers !== undefined ? summary.offline_chargers.toLocaleString() : "—"}
          </p>
          <p className="text-xs text-red-500 font-medium">
            {summary?.offline_percent !== undefined ? summary.offline_percent : "—"}% fault rate
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <p className="text-sm font-semibold text-gray-800 mb-0.5">
          Peak usage hours
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Total energy consumed by hour of day · {selectedBranch === "all" ? "all branches" : (branches.find((b) => b.id === selectedBranch)?.name ?? "selected branch")} · {rangeLabel}
        </p>
        <div className="h-64">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Line data={chartData} options={chartOptions as any} />
        </div>
      </div>
    </div>
  );
}
