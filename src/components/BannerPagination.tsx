import React from 'react';
import Image from 'next/image';

interface BannerPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  selectedFilter?: string;
  searchQuery?: string;
}

export default function BannerPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  selectedFilter,
  searchQuery
}: BannerPaginationProps) {
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (selectedFilter && selectedFilter !== 'All') params.set('status', selectedFilter);
    if (searchQuery) params.set('search', searchQuery);
    params.set('page', page.toString());
    params.set('limit', itemsPerPage.toString());
    return `?${params.toString()}`;
  };

  const getItemsPerPageUrl = (items: number) => {
    const params = new URLSearchParams();
    if (selectedFilter && selectedFilter !== 'All') params.set('status', selectedFilter);
    if (searchQuery) params.set('search', searchQuery);
    params.set('page', '1'); // Reset to first page
    params.set('limit', items.toString());
    return `?${params.toString()}`;
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      buttons.push(
        <a
          key="prev"
          href={getPageUrl(currentPage - 1)}
          className="bg-white hover:bg-[#F9FAFC] rounded border-2 border-white hover:border-[#E4E4E4] disabled:opacity-50 disabled:cursor-not-allowed p-1.5"
        >
          <Image src="/icons/icon-chevron-left.svg" alt="Previous" width={16} height={16} />
        </a>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <a
          key={i}
          href={getPageUrl(i)}
          className={`w-8 h-8 flex items-center justify-center rounded border-2 text-sm ${
            currentPage === i
              ? 'bg-[#F9FAFC] border-2 border-[#E4E4E4]'
              : 'bg-white hover:bg-[#F9FAFC] border-white hover:border-2 hover:border-[#E4E4E4]'
          }`}
        >
          {i}
        </a>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      buttons.push(
        <a
          key="next"
          href={getPageUrl(currentPage + 1)}
          className="bg-white hover:bg-[#F9FAFC] rounded border-2 border-white hover:border-[#E4E4E4] disabled:opacity-50 disabled:cursor-not-allowed p-1.5"
        >
          <Image src="/icons/icon-chevron-right.svg" alt="Next" width={16} height={16} />
        </a>
      );
    }

    return buttons;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 grid grid-cols-3 items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Items per page:</span>
          <div className="flex space-x-1">
            {[6, 12, 24].map((items) => (
              <a
                key={items}
                href={getItemsPerPageUrl(items)}
                className={`w-8 h-8 flex items-center justify-center rounded border-2 text-sm ${
                  itemsPerPage === items
                    ? 'bg-[#F9FAFC] border-2 border-[#E4E4E4]'
                    : 'bg-white hover:bg-[#F9FAFC] border-white hover:border-2 hover:border-[#E4E4E4]'
                }`}
              >
                {items}
              </a>
            ))}
          </div>
        </div>

        <span className="text-sm text-gray-700 text-center">
          Showing {startIndex + 1} to {endIndex} of {totalItems} results
        </span>

        <div className="flex items-center space-x-1 justify-end">
          {renderPaginationButtons()}
        </div>
      </div>
    </div>
  );
}
