import React from 'react';
import Link from 'next/link';

import { Button, PageHeader, StatsCard, DeactivateCustomerButton } from '@/components';
import ServerTableActionBar from '@/components/ServerTableActionBar';
import ServerAdminTable from '@/components/ServerAdminTable';
import { getStatusColor } from '@/constants';
import { getCustomers, updateCustomerStatus, type ApiCustomer, exportUserActivityAsCSV } from '@/lib/actions/user-activity-actions';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Use the ApiCustomer interface from actions but extend for UI needs
interface CustomerData extends ApiCustomer {
  id?: string; // Added by our transform function
}

const customerStatuses = ['All', 'Active', 'Inactive', 'Deleted'] as const;

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

export default async function UserActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Await searchParams before accessing its properties
  const params = await searchParams;
  
  // Extract state from URL search params
  const selectedStatus = (params?.status as string) || 'All';
  const searchQuery = (params?.search as string) || '';
  const currentPage = Number(params?.page) || 1;
  const itemsPerPage = Number(params?.limit) || 10;

  // Server-side data fetching and filtering
  let customers: CustomerData[] = [];
  let totalCustomers = 0;
  let totalOnlineUsers = 0;
  let totalNewUsers = 0;
  let error: string | null = null;

  try {
    // Fetch customers from API
    const result = await getCustomers({
      page: currentPage,
      limit: itemsPerPage,
      status: selectedStatus,
      search: searchQuery,
    });

    customers = result.customers;
    totalCustomers = result.totalCustomers;
    totalOnlineUsers = result.totalOnlineUsers;
    totalNewUsers = result.totalNewUsers;
  } catch (fetchError) {
    console.error('Failed to fetch customers:', fetchError);
    error = 'Failed to load customer data. Please try again later.';
  }

  // Show error fallback if there was an error
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Handler for deactivating customers
  const handleDeactivateCustomer = async (formData: FormData) => {
    'use server';
    return await updateCustomerStatus({}, formData);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalCustomers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCustomers);

  const formatDate = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tableHeaders = [
    'User ID',
    'Full Name',
    'Email & Contact',
    'Status',
    'Transactions',
    // 'Total Spent (₱)',
    'Last Session',
    'Actions'
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Activity"
        description="View and manage user accounts and their activity summary"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Customers"
          value={totalCustomers}
          icon="/icons/icon-total-users.svg"
        />
        <StatsCard
          title="Online Users"
          value={totalOnlineUsers}
          icon="/icons/icon-total-online-users.svg"
        />
        <StatsCard
          title="New Users"
          value={totalNewUsers}
          icon="/icons/icon-total-new-users.svg"
        />
      </div>

      <ServerTableActionBar
        filters={customerStatuses}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
        searchPlaceholder="Search by name, email, or user ID..."
        showExportButton={true}
        showMoreButton={false}
        exportAction={exportUserActivityAsCSV}
      />

      <ServerAdminTable
        headers={tableHeaders}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalCustomers}
        startIndex={startIndex}
        endIndex={endIndex}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
      >
        {customers.map((customer: CustomerData, index: number) => (
          <tr key={customer.user_id ?? `customer-${index}`}>
            <td className="sticky left-0 z-10 bg-white whitespace-nowrap border-inset-r px-6 py-4">
              <div className="font-medium">
                {customer.user_id}
              </div>
            </td>

            <td className="px-6 py-4">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {customer.customer_name}
                </div>
              </div>
            </td>

            <td className="px-6 py-4">
              <div>
                <div className="text-sm text-gray-900">
                  {customer.email}
                </div>
              </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-3 py-1 text-xs rounded-full ${
                getStatusColor(customer.status)
              }`}>
                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
              </span>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {customer.total_transactions}
            </td>

            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              ₱{customer.total_amount_spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td> */}

            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formatDate(customer.last_session_date)}
            </td>

            <td className='px-4 min-w-[150px]'>
              <div className='flex items-center gap-2'>
                <Link href={`/dashboard/user-activity/${customer.user_id}`}>
                  <Button
                    variant="secondary" 
                    icon="/icons/icon-pencil.svg"
                    iconOnly
                    className="shrink-0"
                  />
                </Link>

                <DeactivateCustomerButton
                  customer={customer}
                  onDeactivate={handleDeactivateCustomer}
                />
              </div>
            </td>
          </tr>
        ))}
      </ServerAdminTable>
    </div>
  );
}
