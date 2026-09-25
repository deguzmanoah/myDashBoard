'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ApiVersionLog, ApiChangeItem } from '@/lib/actions/version-log-actions';

interface VersionLogsTabsProps {
  activePlatform: 'Web' | 'Mobile';
  logs: ApiVersionLog[];
}

const releaseBadgeStyles: Record<'Major' | 'Minor' | 'Patch', string> = {
  Major: 'bg-red-100 text-red-700',
  Minor: 'bg-blue-100 text-blue-700',
  Patch: 'bg-green-100 text-green-700',
};

const statusTextStyles: Record<'In Progress' | 'Published' | 'Deferred', string> = {
  'In Progress': 'text-yellow-600',
  Published: 'text-green-600',
  Deferred: 'text-gray-400',
};

const changeGroupConfig: {
  type: ApiChangeItem['change_type'];
  label: string;
}[] = [
  { type: 'Feature', label: 'New Features' },
  { type: 'Improve', label: 'Improvements' },
  { type: 'Fix', label: 'Bug Fixes' },
];

const tabs: { label: string; platform: 'Web' | 'Mobile' }[] = [
  { label: 'Web', platform: 'Web' },
  { label: 'Mobile', platform: 'Mobile' },
];

export default function VersionLogsTabs({ activePlatform, logs }: VersionLogsTabsProps) {
  const router = useRouter();

  // First entry is open by default
  const [openIds, setOpenIds] = useState<Set<number | string>>(
    new Set(logs.length > 0 ? [logs[0].id ?? logs[0].version_number] : [])
  );

  const handleTabClick = (platform: 'Web' | 'Mobile') => {
    router.push(`/dashboard/version-logs?platform=${platform}`);
  };

  const toggleEntry = (key: number | string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB]">
        {tabs.map(({ label, platform }) => (
          <button
            key={platform}
            onClick={() => handleTabClick(platform)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
              activePlatform === platform
                ? 'border-b-2 border-[#090A0A] text-[#090A0A]'
                : 'text-[#616161] hover:text-[#090A0A]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-[#616161] text-sm">
          No version logs yet.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((entry) => {
            const key = entry.id ?? entry.version_number;
            const isOpen = openIds.has(key);

            const grouped = changeGroupConfig
              .map(({ type, label }) => ({
                label,
                items: entry.changes.filter((c) => c.change_type === type),
              }))
              .filter(({ items }) => items.length > 0);

            return (
              <div
                key={key}
                className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden"
              >
                {/* Accordion header */}
                <div className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Toggle area */}
                  <button
                    type="button"
                    onClick={() => toggleEntry(key)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <span className="text-base font-bold text-[#090A0A]">
                      v{entry.version_number}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${releaseBadgeStyles[entry.release_type]}`}
                    > 
                      {entry.release_type}
                    </span>
                    {entry.release_date && (
                      <span className="text-xs font-semibold">{entry.release_date}</span>
                    )}

                    <span className={`text-xs font-semibold ${statusTextStyles[entry.status]}`}>
                      {entry.status}
                    </span>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/dashboard/version-logs/${entry.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Edit version log"
                    >
                      <Image src="/icons/icon-pencil.svg" alt="Edit" width={18} height={18} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleEntry(key)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                      <Image
                        src="/icons/icon-chevron-right.svg"
                        alt={isOpen ? 'Collapse' : 'Expand'}
                        width={18}
                        height={18}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Accordion body */}
                {isOpen && (
                  <div className="px-6 pb-6 space-y-4 border-t border-[#E5E7EB] pt-4">
                    {grouped.map(({ label, items }) => (
                      <div key={label}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#090A0A] mb-1.5">
                          {label}
                        </p>
                        <ul className="space-y-1">
                          {items.map((change, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#616161]">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#616161]" />
                              {change.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

