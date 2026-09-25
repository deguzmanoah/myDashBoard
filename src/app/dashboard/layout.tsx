"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useLocalStorage('sidebar-collapsed', true);

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // No need for authentication checks here - middleware handles it
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />

      {/* Main content */}
      <main className={`flex-1 bg-gray-100 ${collapsed ? 'max-w-[calc(100%-64px)]' : 'max-w-[calc(100%-256px)]'}`}>
        {/* Header */}
        <Header />
        {/* Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
