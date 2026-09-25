"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  getBranchPerformance,
  type ApiBranchPerformance,
} from "@/lib/actions/dashboard-actions";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface BranchOption {
  id: string;
  name: string;
}

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}k`;
  return `₱${value.toFixed(2)}`;
}

function formatDateLabel(start: string, end: string): string {
  if (!start && !end) return "All time";
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const s = start
    ? new Date(start + "T00:00:00").toLocaleDateString("en-US", opts)
    : "";
  const e = end
    ? new Date(end + "T00:00:00").toLocaleDateString("en-US", opts)
    : "";
  if (!s) return `Up to ${e}`;
  if (!e) return `From ${s}`;
  return s === e ? s : `${s} – ${e}`;
}

export default function BranchPerformance() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [pendingRange, setPendingRange] = useState({ start: "", end: "" });
  const [appliedRange, setAppliedRange] = useState({ start: "", end: "" });

  const [data, setData] = useState<ApiBranchPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Skip re-fetch on the initial population of selectedIds (data already loaded)
  const isInitialSelectedSet = useRef(false);

  // Sync selectedIds to URL query params
  const syncToUrl = (ids: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("branch_id");
    ids.forEach((id) => params.append("branch_id", id));
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // On mount: load branch options and initial data (no filters = beginning of time)
  useEffect(() => {
    const urlIds = searchParams.getAll("branch_id");
    setIsLoading(true);
    getBranchPerformance(undefined, undefined, urlIds.length ? urlIds : undefined)
      .then((d) => {
        setData(d);
        const opts =
          d?.branch_revenue_graph?.map((b) => ({
            id: String(b.branch_id),
            name: b.station_name.trim(),
          })) ?? [];
        setBranchOptions(opts);
        // Prefer URL ids if present, otherwise select all
        const initial =
          urlIds.length > 0
            ? urlIds.filter((id) => opts.some((o) => o.id === id))
            : opts.map((o) => o.id);
        setSelectedIds(initial);
      })
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when user changes filters (skip the initial selectedIds population)
  useEffect(() => {
    if (selectedIds === null) return;
    if (!isInitialSelectedSet.current) {
      isInitialSelectedSet.current = true;
      return;
    }
    syncToUrl(selectedIds);
    setIsLoading(true);
    getBranchPerformance(
      appliedRange.start || undefined,
      appliedRange.end || undefined,
      selectedIds.length > 0 ? selectedIds : undefined,
    )
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedRange.start, appliedRange.end, selectedIds]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const toggleBranch = (id: string) => {
    setSelectedIds((prev) => {
      if (!prev) return prev;
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // enforce min 1
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const rangeLabel = formatDateLabel(appliedRange.start, appliedRange.end);
  const summary = data?.branch_summary;
  const branches = data?.branch_revenue_graph ?? [];

  const chartData = {
    labels: branches.map((b) => b.station_name.trim()),
    datasets: [
      {
        label: "Energy (kWh)",
        data: branches.map((b) => b.kwh),
        backgroundColor: "#3b82f6",
        borderRadius: 3,
        yAxisID: "yLeft",
      },
      {
        label: "Sessions",
        data: branches.map((b) => b.sessions),
        backgroundColor: "#22c55e",
        borderRadius: 3,
        yAxisID: "yLeft",
      },
      {
        label: "Revenue (₱)",
        data: branches.map((b) => b.revenue),
        backgroundColor: "#a855f7",
        borderRadius: 3,
        yAxisID: "yRevenue",
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
          label: (ctx: {
            dataset: { label: string };
            parsed: { y: number };
          }) => {
            if (ctx.dataset.label?.includes("Revenue")) {
              return ` ${formatRevenue(ctx.parsed.y)}`;
            }
            if (ctx.dataset.label?.includes("Energy")) {
              return ` ${ctx.parsed.y.toFixed(2)} kWh`;
            }
            return ` ${ctx.parsed.y} sessions`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6b7280", font: { size: 11 } },
        border: { display: false },
      },
      yLeft: {
        type: "linear" as const,
        position: "left" as const,
        grid: { color: "rgba(0,0,0,0.06)" },
        border: { display: false },
        ticks: { color: "#6b7280", font: { size: 11 } },
        title: {
          display: true,
          text: "Energy (kWh) / Sessions",
          color: "#6b7280",
          font: { size: 11 },
        },
      },
      yRevenue: {
        type: "linear" as const,
        position: "right" as const,
        grid: { drawOnChartArea: false },
        border: { display: false },
        ticks: {
          color: "#a855f7",
          font: { size: 11 },
          callback: (v: number | string) => formatRevenue(Number(v)),
        },
        title: {
          display: true,
          text: "Revenue (₱)",
          color: "#a855f7",
          font: { size: 11 },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-36" />
            <div className="h-8 bg-gray-200 rounded w-28" />
            <div className="h-8 bg-gray-200 rounded w-28" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="h-72 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          Branch Performance
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch multi-select dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="border border-gray-300 rounded-md text-sm px-3 py-1.5 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1.5 min-w-[140px]"
            >
              <span className="truncate flex-1 text-left">
                {!selectedIds || selectedIds.length === 0
                  ? "No branch"
                  : selectedIds.length === branchOptions.length
                  ? "All branches"
                  : `${selectedIds.length} branch${selectedIds.length > 1 ? "es" : ""}`}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 py-1">
                {branchOptions.map((b) => {
                  const checked = selectedIds?.includes(b.id) ?? false;
                  const isLastSelected =
                    checked && (selectedIds?.length ?? 0) <= 1;
                  return (
                    <label
                      key={b.id}
                      className={`flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 ${
                        isLastSelected
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isLastSelected}
                        onChange={() => toggleBranch(b.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate">{b.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date range pickers */}
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
            type="button"
            onClick={() => setAppliedRange(pendingRange)}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total branches */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            Total branches
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {summary?.total_branches ?? "—"}
          </p>
        </div>

        {/* Total energy */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Total energy (kWh)
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {summary?.total_energy_kwh !== undefined
              ? summary.total_energy_kwh.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : "—"}
          </p>
        </div>

        {/* Total sessions */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Total sessions
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {summary?.total_sessions !== undefined
              ? summary.total_sessions.toLocaleString()
              : "—"}
          </p>
        </div>

        {/* Total revenue */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Total revenue
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {summary?.total_revenue !== undefined
              ? formatRevenue(summary.total_revenue)
              : "—"}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <p className="text-sm font-semibold text-gray-800 mb-0.5">
          Energy, sessions &amp; revenue by branch — top {branches.length}
        </p>
        <p className="text-xs text-gray-400 mb-4">{rangeLabel}</p>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
            Energy (kWh)
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            Sessions
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />
            Revenue (₱)
          </div>
        </div>

        <div className="h-72">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Bar data={chartData} options={chartOptions as any} />
        </div>
      </div>
    </div>
  );
}
