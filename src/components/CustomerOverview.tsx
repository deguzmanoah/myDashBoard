"use client";

import React, { useState, useEffect } from "react";
import {
  getCustomerOverview,
  type ApiCustomerOverview,
} from "@/lib/actions/dashboard-actions";
import { getBranches } from "@/lib/actions/branch-actions";

interface BranchOption {
  id: string;
  name: string;
}

interface Customer {
  name: string;
  lastBranch: string;
  lastDate: string;
  totalSpent: number;
  totalSessions: number;
}

type ViewBy = "spend" | "sessions";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateLabel(start: string, end: string): string {
  if (!start && !end) return "All time";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const s = start ? new Date(start + "T00:00:00").toLocaleDateString("en-US", opts) : "";
  const e = end ? new Date(end + "T00:00:00").toLocaleDateString("en-US", opts) : "";
  return s === e ? s : `${s} – ${e}`;
}

export default function CustomerOverview() {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("all");

  const [pendingRange, setPendingRange] = useState({ start: "", end: "" });
  const [appliedRange, setAppliedRange] = useState({ start: "", end: "" });

  const [viewBy, setViewBy] = useState<ViewBy>("spend");

  const [data, setData] = useState<ApiCustomerOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBranches({ page: 1, limit: 999, status: "All", search: "" })
      .then((res) =>
        setBranches(res.branches.map((b) => ({ id: b.id!, name: b.station_name })))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const branchId = selectedBranch !== "all" ? selectedBranch : undefined;
    const sortBy = viewBy === "sessions" ? "total_sessions" : "total_spent";
    getCustomerOverview(
      appliedRange.start || undefined,
      appliedRange.end || undefined,
      branchId,
      sortBy,
    )
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [appliedRange.start, appliedRange.end, selectedBranch, viewBy]);

  const canApply = pendingRange.start !== "" && pendingRange.end !== "";
  const hasAppliedRange = appliedRange.start !== "" || appliedRange.end !== "";
  const asOfLabel = formatDateLabel(appliedRange.start, appliedRange.end);

  const customers: Customer[] = (data?.customer_ranking_list ?? []).map((c) => ({
    name: c.customer_name,
    lastBranch: c.last_branch_charged,
    lastDate: c.last_date_charged,
    totalSpent: c.total_spent,
    totalSessions: c.total_sessions,
  }));

  // Client-side sort fallback (BE will sort server-side via sort_by param)
  const sortedCustomers = [...customers].sort((a, b) =>
    viewBy === "sessions" ? b.totalSessions - a.totalSessions : b.totalSpent - a.totalSpent
  );

  const tableTitle =
    viewBy === "sessions"
      ? "Top 10 customers by total sessions"
      : "Top 10 customers by total spend";

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="border border-gray-100 rounded-lg p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-3 bg-gray-200 rounded w-32" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-32" />
            <div className="h-8 bg-gray-200 rounded w-40" />
            <div className="h-8 bg-gray-200 rounded w-28 ml-auto" />
            <div className="h-8 bg-gray-200 rounded w-28" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          Customer Overview
        </div>
        <span className="text-xs text-gray-400">As of {asOfLabel}</span>
      </div>

      {/* Stats row — 2 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total customers */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Total customers
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data?.customer_summary?.total_customers !== undefined
              ? data.customer_summary.total_customers.toLocaleString()
              : "—"}
          </p>
        </div>

        {/* New this month */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="12" y1="1" x2="12" y2="4" /><line x1="10" y1="2.5" x2="14" y2="2.5" />
            </svg>
            New this month
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data?.customer_summary?.new_customers !== undefined
              ? data.customer_summary.new_customers.toLocaleString()
              : "—"}
          </p>
        </div>
      </div>

      {/* Table section */}
      <div className="border border-gray-100 rounded-lg p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">{tableTitle}</p>
          <p className="text-xs text-gray-400">
            Ranked highest to lowest · {asOfLabel.toLowerCase()}
          </p>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border border-gray-300 rounded-md text-sm text-gray-700 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* View by toggle */}
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
            <button
              onClick={() => setViewBy("spend")}
              className={`px-3 py-1.5 transition-colors ${
                viewBy === "spend"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Total spend
            </button>
            <button
              onClick={() => setViewBy("sessions")}
              className={`px-3 py-1.5 border-l border-gray-300 transition-colors ${
                viewBy === "sessions"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Total sessions
            </button>
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-1.5 ml-auto">
            <input
              type="date"
              value={pendingRange.start}
              onChange={(e) =>
                setPendingRange((r) => ({ ...r, start: e.target.value }))
              }
              className="border border-gray-300 rounded-md text-sm text-gray-700 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="date"
              value={pendingRange.end}
              onChange={(e) =>
                setPendingRange((r) => ({ ...r, end: e.target.value }))
              }
              className="border border-gray-300 rounded-md text-sm text-gray-700 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              disabled={!canApply}
              onClick={() => setAppliedRange(pendingRange)}
              className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white disabled:opacity-40 hover:bg-gray-800 transition-colors"
            >
              Apply
            </button>
            {hasAppliedRange && (
              <button
                onClick={() => {
                  setPendingRange({ start: "", end: "" });
                  setAppliedRange({ start: "", end: "" });
                }}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-medium pb-2 w-8"></th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">Name</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">Last branch charged</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">Last date charged</th>
                <th className="text-right text-xs text-gray-400 font-medium pb-2"># of sessions</th>
                <th className="text-right text-xs text-gray-400 font-medium pb-2">Total spent</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                    No data available
                  </td>
                </tr>
              ) : (
                sortedCustomers.map((customer, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-xs text-gray-400 font-medium">{idx + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gray-200 text-gray-600">
                          {getInitials(customer.name)}
                        </span>
                        <span className="text-gray-800 font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {customer.lastBranch}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{formatDate(customer.lastDate)}</td>
                    <td className="py-3 text-right text-gray-800 font-semibold">
                      {customer.totalSessions.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-gray-800 font-semibold">
                      ₱{customer.totalSpent.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
