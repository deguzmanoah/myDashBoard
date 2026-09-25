import React from 'react';
import Link from 'next/link';

import { Button, PageHeader, DeactivateBranchButton } from '@/components';
import ServerTableActionBar from '@/components/ServerTableActionBar';
import ServerAdminTable from '@/components/ServerAdminTable';
import { getStatusColor } from '@/constants';

import { getBranches, updateBranch, type ApiBranch, exportBranchesAsCSV } from '@/lib/actions/branch-actions';
import { getUserData } from '@/lib/actions/auth-actions';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

type TransformedBranch = ApiBranch & { id?: string };

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

export default async function BranchesPage({
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

  // Server-side data fetching
  let branches: TransformedBranch[] = [];
  let totalItems = 0;
  let branchStatuses: readonly string[] = [];
  let error: string | null = null;
  
  try {
    const result = await getBranches({
      page: currentPage,
      limit: itemsPerPage,
      status: selectedStatus,
      search: searchQuery,
    });
    branches = result.branches;
    totalItems = result.totalItems;
    branchStatuses = result.branchStatuses;
  } catch (fetchError) {
    console.error('Failed to fetch branches:', fetchError);
    error = 'Failed to load branch data. Please try again later.';
    // Set defaults for error state
    branchStatuses = ['Active', 'Inactive'];
  }

  // Show error fallback if there was an error
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Get current logged-in user data
  const currentUser = await getUserData();

  // Create a bound updateBranch function for form action
  const handleDeactivateBranch = async (formData: FormData) => {
    'use server';
    // Add the current user ID to the form data
    formData.set('admin_id', currentUser?.id || '');
    return await updateBranch({}, formData);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const tableHeaders = [
    'Station Name',
    'City',
    'Region',
    'Address',
    'Zip Code',
    'Status',
    'Action'
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Branches"
        description="Manage branch locations and their details."
      >
        <Link href="/dashboard/branches/add">
          <Button 
            label="Add Branch"
            variant="primary" 
            icon="/icons/icon-plus.svg"
          />
        </Link>
      </PageHeader>

      <ServerTableActionBar
        filters={branchStatuses}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
        searchPlaceholder="Search for station name, city, or address..."
        showExportButton={true}
        showMoreButton={false}
        exportAction={exportBranchesAsCSV}
      />

      <ServerAdminTable
        headers={tableHeaders}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
      >
        {branches.map((branch, index) => (
          <tr key={branch.id || branch.branch_id || index} className="hover:bg-gray-50">
            {/* Station Name */}
            <td className="px-6 py-4">
              <div className="text-sm font-medium text-gray-900">{branch.station_name}</div>
            </td>

            {/* City */}
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900">{branch.city}</div>
            </td>

            {/* Region */}
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900">{branch.region}</div>
            </td>

            {/* Address */}
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900">{branch.address}</div>
            </td>

            {/* Zip Code */}
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900">{branch.zip_code}</div>
            </td>

            {/* Status */}
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`inline-flex px-3 py-1 text-xs rounded-full ${getStatusColor(branch.status)}`}
              >
                {branch.status}
              </span>
            </td>

            {/* Action */}
            <td className='px-4 min-w-[150px]'>
              <div className='flex items-center gap-2'>
                <Link href={`/dashboard/branches/${branch.branch_id}`}>
                  <Button
                    variant="secondary" 
                    icon="/icons/icon-pencil.svg"
                    iconOnly
                    className="shrink-0"
                  />
                </Link>

                <DeactivateBranchButton
                  branch={branch}
                  onDeactivate={handleDeactivateBranch}
                />
              </div>
            </td>
          </tr>
        ))}
      </ServerAdminTable>
    </div>
  );
}
