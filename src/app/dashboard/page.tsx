import React from 'react';
import { createPageMetadata } from '@/lib/metadata';
import { getUserData } from '@/lib/actions/auth-actions';
import DashboardClient from '@/components/DashboardClient';

export const metadata = createPageMetadata('Dashboard', 'Charge admin dashboard - manage EV charging stations');

export default async function DashboardHome() {
  const userData = await getUserData();
  const userName = userData?.name || 'User';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl text-[#090A0A] font-semibold mb-2">
          Welcome back, {userName}!
        </h2>
        <p className="text-[#616161]">
          Manage stations, monitor sessions, and keep everything running smoothly.
        </p>
      </div>

      <DashboardClient />
    </div>
  );
}
