import React from 'react';
import Link from 'next/link';
import { PageHeader, Button } from '@/components';
import { createPageMetadata } from '@/lib/metadata';
import { getVersionLogs } from '@/lib/actions/version-log-actions';
import VersionLogsTabs from './VersionLogsTabs';

export const metadata = createPageMetadata('Version Logs', 'Charge admin dashboard version history and changelog');

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export default async function VersionLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const platform = (params?.platform as 'Web' | 'Mobile') ?? 'Web';

  const logs = await getVersionLogs(platform);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Version Logs"
        description="A history of all updates, improvements, and fixes to the admin dashboard and the mobile app."
      >
        <Link href="/dashboard/version-logs/add">
          <Button
            label="Add Log"
            icon="/icons/icon-plus.svg"
            variant="primary"
          />
        </Link>
      </PageHeader>

      <VersionLogsTabs activePlatform={platform} logs={logs} />
    </div>
  );
}
