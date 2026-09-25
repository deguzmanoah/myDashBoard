import React, { ReactNode } from 'react';
import Image from 'next/image';

interface AdminTableProps {
  headers: string[];
  children: ReactNode;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export function AdminTable({
  headers,
  children,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange
}: AdminTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-[#F5F5F5]">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className={`px-6 py-4 text-left font-medium ${
                    index === 0 ? 'sticky left-0 z-10 bg-[#F5F5F5] border-inset-r' : ''
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {children}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-[#e5e7eb">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="text-sm :bg-[#F9FAFC] rounded border-2 border-[#E4E4E4] disabled:opacity-50 disabled:cursor-not-allowed p-1.5 outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-white hover:bg-[#F9FAFC] rounded border-2 border-white hover:border-[#E4E4E4] disabled:opacity-50 disabled:cursor-not-allowed p-1.5"
            >
              <Image 
                src="/icons/icon-chevron-left.svg" 
                alt="Previous" 
                width={16} 
                height={16}
              />
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current page
              const shouldShow = 
                page === 1 || 
                page === totalPages || 
                Math.abs(page - currentPage) <= 1;

              if (!shouldShow && page === 2 && currentPage > 4) {
                return (
                  <span
                    key="dots1"
                    className="px-3 py-2 text-gray-500"
                  >
                    ...
                  </span>
                );
              }

              if (!shouldShow && page === totalPages - 1 && currentPage < totalPages - 3) {
                return (
                  <span
                    key="dots2"
                    className="px-3 py-2 text-gray-500"
                  >
                    ...
                  </span>
                );
              }

              if (!shouldShow) return null;

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded border-2 text-sm ${
                    currentPage === page
                      ? 'bg-[#F9FAFC] border-2 border-[#E4E4E4]'
                      : 'bg-white hover:bg-[#F9FAFC] border-white hover:border-2 hover:border-[#E4E4E4]'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-white hover:bg-[#F9FAFC] rounded border-2 border-white hover:border-2 hover:border-[#E4E4E4] text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed p-1.5"
            >
              <Image 
                src="/icons/icon-chevron-right.svg" 
                alt="Next" 
                width={16} 
                height={16}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
