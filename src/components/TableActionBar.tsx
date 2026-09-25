import React from 'react';
import { Button, SearchBar } from '@/components';

interface TableActionBarProps {
  filters: readonly string[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  showExportButton?: boolean;
  showMoreButton?: boolean;
  onExportClick?: () => void;
  onMoreClick?: () => void;
}

export default function TableActionBar({
  filters,
  selectedFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search for any keywords...",
  showExportButton = true,
  showMoreButton = true,
  onExportClick,
  onMoreClick,
}: TableActionBarProps) {
  return (
    <div className='flex items-center gap-2 justify-between'>
      <div className='flex items-center gap-2'>
        {filters.map((filter) => {
          return (
            <Button
              key={filter}
              label={filter}
              variant="secondary"
              active={selectedFilter === filter}
              onClick={() => onFilterChange(filter)}
            />
          )
        })}
      </div>

      <div className='flex-1 flex items-center gap-4 max-w-[746px]'>
        <div className='flex-1'>
          <SearchBar
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>

        {showExportButton && (
          <Button 
            label="Export"
            variant="secondary" 
            icon="/icons/icon-download-cloud.svg"
            iconWidth={24}
            iconHeight={24}
            roundedFull={false}
            onClick={onExportClick}
          />
        )}

        {showMoreButton && (
          <Button 
            variant="secondary" 
            icon="/icons/icon-more.svg"
            iconWidth={24}
            iconHeight={24}
            roundedFull={false}
            onClick={onMoreClick}
          />
        )}
      </div>
    </div>
  );
}
