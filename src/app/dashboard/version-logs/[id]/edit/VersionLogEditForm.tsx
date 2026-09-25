'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import VersionLogForm, { type VersionLogFormData } from '@/components/VersionLogForm';
import type { ApiVersionLog } from '@/lib/actions/version-log-actions';

interface VersionLogEditFormProps {
  log: ApiVersionLog;
}

export default function VersionLogEditForm({ log }: VersionLogEditFormProps) {
  const router = useRouter();

  const initialData: Partial<VersionLogFormData> = {
    id: String(log.id),
    platform: log.platform,
    releaseType: log.release_type,
    version_number: log.version_number,
    release_date: log.release_date,
    changes: log.changes,
    status: log.status,
  };

  return (
    <VersionLogForm
      initialData={initialData}
      isEditing
      onCancel={() => router.push('/dashboard/version-logs')}
    />
  );
}
