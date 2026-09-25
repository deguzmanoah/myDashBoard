import React, { ReactNode } from 'react';
import Image from 'next/image';

interface ServerAdminTableProps {
  headers: string[];
  children: ReactNode;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  selectedFilter?: string;
  searchQuery?: string;
  searchParams?: Record<string, string>;
}

export default function ServerAdminTable({
  headers,
  children,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  selectedFilter,
  searchQuery,
  searchParams
}: ServerAdminTableProps) {
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (selectedFilter && selectedFilter !== 'all') params.set('status', selectedFilter);
    else params.delete('status');
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
    params.set('page', page.toString());
    params.set('limit', itemsPerPage.toString());
    return `?${params.toString()}`;
  };

  const getItemsPerPageUrl = (items: number) => {
    const params = new URLSearchParams(searchParams);
    if (selectedFilter && selectedFilter !== 'all') params.set('status', selectedFilter);
    else params.delete('status');
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`px-6 py-5 text-left text-sm font-medium ${
                    index === 0 ? 'sticky left-0 z-20 bg-gray-50' : ''
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {children}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer - Only show if there are items */}
      {totalItems > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 grid grid-cols-3 items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Items per page:</span>
              <div className="flex space-x-1">
                {[10, 25, 50].map((items) => (
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
      )}
    </div>
  );
}
