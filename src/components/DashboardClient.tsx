"use client";

import React from "react";
import ChargerPerformance from "./ChargerPerformance";
import BranchPerformance from "./BranchPerformance";
import CustomerOverview from "./CustomerOverview";

export default function DashboardClient() {
  return (
    <div className="space-y-6">
      {/* Charger Performance — self-managed with own filters */}
      <ChargerPerformance />

      {/* Branch Performance */}
      <BranchPerformance />

      {/* Customer Overview */}
      <CustomerOverview />
    </div>
  );
}
