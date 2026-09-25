'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Button, SearchBar } from '@/components';
import SelectField from './SelectField';
import ExportButton from './ExportButton';

interface ServerTableActionBarProps {
  filters: readonly string[];
  selectedFilter: string;
  searchQuery: string;
  searchPlaceholder?: string;
  showExportButton?: boolean;
  showMoreButton?: boolean;
  showDateFilter?: boolean;
  startDateTime?: string;
  endDateTime?: string;
  exportAction?: (formData: FormData) => Promise<{
    success: boolean;
    csvContent?: string;
    filename?: string;
    error?: string;
  }>;
  onMoreClick?: () => void;
}

type DatePreset = 'All' | 'Today' | 'Yesterday' | 'This Month' | 'Last Month' | 'Custom';
const DATE_PRESET_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Today', label: 'Today' },
  { value: 'Yesterday', label: 'Yesterday' },
  { value: 'This Month', label: 'This Month' },
  { value: 'Last Month', label: 'Last Month' },
  { value: 'Custom', label: 'Custom Date Range' },
];

function formatDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getPresetDates(preset: Exclude<DatePreset, 'All' | 'Custom'>): { start: string; end: string } {
  const now = new Date();
  switch (preset) {
    case 'Today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
      return { start: formatDateTime(start), end: formatDateTime(end) };
    }
    case 'Yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59);
      return { start: formatDateTime(start), end: formatDateTime(end) };
    }
    case 'This Month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59);
      return { start: formatDateTime(start), end: formatDateTime(end) };
    }
    case 'Last Month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59);
      return { start: formatDateTime(start), end: formatDateTime(end) };
    }
  }
}

function detectPreset(startDT?: string, endDT?: string): DatePreset | null {
  if (!startDT && !endDT) return 'All';
  for (const preset of ['Today', 'Yesterday', 'This Month', 'Last Month'] as const) {
    const { start, end } = getPresetDates(preset);
    if (start === startDT && end === endDT) return preset;
  }
  return 'Custom';
}

export default function ServerTableActionBar({
  filters,
  selectedFilter,
  searchQuery,
  searchPlaceholder = "Search for any keywords...",
  showExportButton = true,
  showMoreButton = false,
  showDateFilter = false,
  startDateTime,
  endDateTime,
  exportAction,
  onMoreClick,
}: ServerTableActionBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedPreset, setSelectedPreset] = useState<DatePreset | null>(() => detectPreset(startDateTime, endDateTime));
  const [currentSearch, setCurrentSearch] = useState(searchQuery);
  const [customStartDate, setCustomStartDate] = useState(() => (startDateTime || '').split('T')[0] || '');
  const [customStartTime, setCustomStartTime] = useState(() => (startDateTime || '').split('T')[1] || '');
  const [customEndDate, setCustomEndDate] = useState(() => (endDateTime || '').split('T')[0] || '');
  const [customEndTime, setCustomEndTime] = useState(() => (endDateTime || '').split('T')[1] || '');

  useEffect(() => {
    setSelectedPreset(detectPreset(startDateTime, endDateTime));
  }, [startDateTime, endDateTime]);

  useEffect(() => {
    setCurrentSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setCustomStartDate((startDateTime || '').split('T')[0] || '');
    setCustomStartTime((startDateTime || '').split('T')[1] || '');
    setCustomEndDate((endDateTime || '').split('T')[0] || '');
    setCustomEndTime((endDateTime || '').split('T')[1] || '');
  }, [startDateTime, endDateTime]);

  const handleCustomApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let finalStart = customStartDate ? `${customStartDate}T${customStartTime || '00:00'}` : '';
    let finalEnd = customEndDate ? `${customEndDate}T${customEndTime || '23:59'}` : '';

    if (finalStart && !finalEnd) {
      finalEnd = `${customStartDate}T23:59`;
    } else if (!finalStart && finalEnd) {
      finalStart = `${customEndDate}T00:00`;
    }

    const params = new URLSearchParams();
    if (selectedFilter !== 'all') params.set('status', selectedFilter);
    if (currentSearch) params.set('search', currentSearch);
    params.set('page', '1');
    if (finalStart) params.set('start_date_time', finalStart);
    if (finalEnd) params.set('end_date_time', finalEnd);

    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePresetClick = (preset: DatePreset) => {
    if (preset === 'Custom') {
      setSelectedPreset('Custom');
      return;
    }
    setSelectedPreset(preset);
    const params = new URLSearchParams();
    if (selectedFilter !== 'all') params.set('status', selectedFilter);
    if (currentSearch) params.set('search', currentSearch);
    params.set('page', '1');
    if (preset !== 'All') {
      const { start, end } = getPresetDates(preset);
      params.set('start_date_time', start);
      params.set('end_date_time', end);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-start gap-2 justify-between'>
        {filters?.length > 0 && (
          <div className='flex items-center gap-2'>
            {/* Filter buttons using links */}
            {filters.map((filter) => (
              <a
                key={filter}
                href={`?${new URLSearchParams({
                  ...(currentSearch && { search: currentSearch }),
                  ...(filter !== 'all' && { status: filter }),
                  page: '1' // Reset to first page when changing filter
                }).toString()}`}
              >
                <Button
                  key={filter}
                  label={filter.charAt(0).toUpperCase() + filter.slice(1)}
                  variant="secondary"
                  active={selectedFilter === filter}
                />
              </a>
            ))}
          </div>
        )}

        {showDateFilter && (
          <div className='flex flex-col gap-2 items-start date-filter'>
            <SelectField
              label='Date Filter:'
              inline
              options={DATE_PRESET_OPTIONS}
              value={selectedPreset ?? 'All'}
              onChange={(value) => handlePresetClick(value as DatePreset)}
              className='!rounded-full min-w-[180px]'
            />

            {selectedPreset === 'Custom' && (
              <form onSubmit={handleCustomApply} className='flex items-center gap-2'>
                <div className='flex items-center gap-2 bg-white border border-gray-300 rounded-full py-3 px-4 text-sm'>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className='outline-none text-gray-700'
                  />
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className='outline-none text-gray-700'
                    placeholder='--:--'
                  />
                  <span className='text-gray-400'>—</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className='outline-none text-gray-700'
                  />
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className='outline-none text-gray-700'
                    placeholder='--:--'
                  />
                </div>

                <Button label='Apply' type='submit' />
              </form>
            )}
          </div>
        )}

        <div
          className={clsx("flex-1 flex items-center gap-4 max-w-[746px]", {

          })}
        >
          <SearchBar
            placeholder={searchPlaceholder}
            defaultValue={searchQuery}
            name="search"
            asFormInput={true}
            onChange={setCurrentSearch}
          >
            {/* Preserve current filter */}
            {selectedFilter !== 'all' && (
              <input type="hidden" name="status" value={selectedFilter} />
            )}
          </SearchBar>

          {showExportButton && exportAction && (
            <ExportButton
              exportAction={exportAction}
              selectedFilter={selectedFilter}
              searchQuery={searchQuery}
              startDateTime={startDateTime}
              endDateTime={endDateTime}
            />
          )}

          {showMoreButton && (
            <Button 
              variant="secondary" 
              icon="/icons/icon-more.svg"
              iconWidth={20}
              iconHeight={20}
              roundedFull={false}
              onClick={onMoreClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
