import React from 'react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components';
import { createPageMetadata } from '@/lib/metadata';
import { getVersionLog } from '@/lib/actions/version-log-actions';
import VersionLogEditForm from './VersionLogEditForm';

export const metadata = createPageMetadata('Edit Version Log', 'Edit a version log entry');

export default async function EditVersionLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const log = await getVersionLog(id);

  if (!log) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Version Log"
        description={`Editing v${log.version_number} — ${log.platform}`}
      />

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <VersionLogEditForm log={log} />
      </div>
    </div>
  );
}
