import React from 'react';

import { PageHeader } from '@/components';
import ServerTableActionBar from '@/components/ServerTableActionBar';
import ServerAdminTable from '@/components/ServerAdminTable';
import { getStatusColor } from '@/constants';

import { getTransactions, type ApiTransaction, exportFreeChargingAsCSV } from '@/lib/actions/transaction-actions';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

interface ErrorFallbackProps {
  error: string;
}

function ErrorFallback({ error }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
        <div className="text-gray-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default async function FreeChargingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Await searchParams before accessing its properties
  const params = await searchParams;
  
  // Extract state from URL search params
  const searchQuery = (params?.search as string) || '';
  const currentPage = Number(params?.page) || 1;
  const itemsPerPage = Number(params?.limit) || 10;
  const startDateTime = (params?.start_date_time as string) || '';
  const endDateTime = (params?.end_date_time as string) || '';

  // Server-side data fetching
  let transactions: ApiTransaction[] = [];
  let totalItems = 0;
  let error: string | null = null;
  
  try {
    const result = await getTransactions({
      page: currentPage,
      limit: itemsPerPage,
      status: '',
      search: searchQuery,
      transactionType: 'free_charging',
      startDateTime,
      endDateTime,
    });
    transactions = result.transactions;
    totalItems = result.totalItems;
  } catch (fetchError) {
    console.error('Failed to fetch transactions:', fetchError);
    error = 'Failed to load transaction data. Please try again later.';
    // Set defaults for error state
  }

  // Show error fallback if there was an error
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const tableHeaders = [
    'Customer Name',
    'Branch',
    'Serial Number',
    'Connector Code',
    'Charge Start Date',
    'Charge End Date',
    'Charge Duration',
    'Total kWh',
    'Charge Status'
  ];

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper function to format duration
  const formatDuration = (duration: string | null | undefined) => {
    if (!duration) return 'N/A';
    return duration;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Free Charging"
        description="View and manage all free charging transaction records."
      />

      <ServerTableActionBar
        filters={[]}
        selectedFilter={''}
        searchQuery={searchQuery}
        searchPlaceholder="Search for customer name"
        showExportButton={true}
        showDateFilter={true}
        showMoreButton={false}
        startDateTime={startDateTime}
        endDateTime={endDateTime}
        exportAction={exportFreeChargingAsCSV}
      />

      <ServerAdminTable
        headers={tableHeaders}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        selectedFilter={''}
        searchQuery={searchQuery}
        searchParams={params as Record<string, string>}
      >
        {transactions.map((transaction, index) => (
          <tr key={index}>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {transaction.customer_name || 'N/A'}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {transaction.branch || 'N/A'}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[200px]">
              {transaction.serial_number || 'N/A'}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[200px]">
              {transaction.connector_code || 'N/A'}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[200px]">
              {formatDate(transaction.charge_start_date)}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[200px]">
              {formatDate(transaction.charge_end_date)}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[200px]">
              {formatDuration(transaction.charge_duration)}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[200px]">
              {transaction.total_kwh ? `${transaction.total_kwh}` : 'N/A'}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {!transaction.charge_status || transaction.charge_status.toLowerCase() === 'ongoing'
                ? 'N/A'
                : (
                  <span className={`inline-flex px-3 py-1 text-xs rounded-full ${
                    getStatusColor(transaction.charge_status)
                  }`}>
                    {transaction.charge_status}
                  </span>
                )
              }
            </td>
          </tr>
        ))}
      </ServerAdminTable>
    </div>
  );
}
