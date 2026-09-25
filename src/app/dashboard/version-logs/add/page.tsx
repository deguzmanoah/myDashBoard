'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components';
import VersionLogForm from '@/components/VersionLogForm';

export default function AddVersionLogPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Version Log"
        description="Create a new version log entry for web or mobile."
      />

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <VersionLogForm onCancel={() => router.push('/dashboard/version-logs')} />
      </div>
    </div>
  );
}
