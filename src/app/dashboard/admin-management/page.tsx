import React from 'react';
import Link from 'next/link';

import { Button, PageHeader, DeactivateAdminButton } from '@/components';
import ServerTableActionBar from '@/components/ServerTableActionBar';
import ServerAdminTable from '@/components/ServerAdminTable';
import { getStatusColor, normalizeStatus } from '@/constants';

import { getAdmins, deactivateAdmin, type ApiUser, exportAdminsAsCSV } from '@/lib/actions/admin-actions';
import { getUserData } from '@/lib/actions/auth-actions';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

type TransformedAdmin = ApiUser & { id?: string; lastLogin: null };

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

export default async function AdminManagementPage({
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
  let admins: TransformedAdmin[] = [];
  let totalItems = 0;
  let adminStatuses: readonly string[] = [];
  let error: string | null = null;
  
  try {
    const result = await getAdmins({
      page: currentPage,
      limit: itemsPerPage,
      status: selectedStatus.toLowerCase() === 'all' ? '' : selectedStatus,
      search: searchQuery,
    });
    admins = result.admins;
    totalItems = result.totalItems;
    adminStatuses = result.adminStatuses;
  } catch (fetchError) {
    console.error('Failed to fetch admins:', fetchError);
    error = 'Failed to load admin data. Please try again later.';
    // Set defaults for error state
    const { adminStatuses: fallbackStatuses } = await import('@/data/mockAdmins');
    adminStatuses = fallbackStatuses;
  }

  // Show error fallback if there was an error
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Get current logged-in user data
  const currentUser = await getUserData();

  // Create a bound deactivateAdmin function for form action
  const handleDeactivateAdmin = async (formData: FormData) => {
    'use server';
    // Add the current user ID to the form data
    formData.set('updated_by_admin_id', currentUser?.id || '');
    return await deactivateAdmin({}, formData);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const tableHeaders = [
    'Full Name',
    'Email', 
    'Role',
    'Status',
    'Organization/Merchant',
    'Invited By',
    'Last Login',
    'Action'
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin Management"
        description="Manage and integrate payment methods for secure and seamless transactions."
      >
        <Link href="/dashboard/admin-management/add-admin">
          <Button 
            label="Add Admin"
            variant="primary" 
            icon="/icons/icon-plus.svg"
          />
        </Link>
      </PageHeader>

      <ServerTableActionBar
        filters={adminStatuses}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
        searchPlaceholder="Search for name or email..."
        showExportButton={true}
        showMoreButton={false}
        exportAction={exportAdminsAsCSV}
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
        {admins.map((admin, index: number) => (
          <tr key={index}>
            <td className="sticky left-0 z-10 bg-white whitespace-nowrap border-inset-r px-6 py-4">
              <div className="font-medium">
                {admin.first_name} {admin.last_name}
              </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {admin.email}
            </td>

            <td className="px-6 py-4 whitespace-nowrap capitalize">
              {admin.role}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-3 py-1 text-xs rounded-full ${
                getStatusColor(admin.status)
              }`}>
                {normalizeStatus(admin.status)}
              </span>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              {admin.organization}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              {admin.invite_name || 'System'}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              {/* Nice to have for now */}
            </td>

            <td className='px-4 min-w-[150px]'>
              <div className='flex items-center gap-2'>
                <Link href={`/dashboard/admin-management/${admin.id}`}>
                  <Button
                    variant="secondary" 
                    icon="/icons/icon-pencil.svg"
                    iconOnly
                    className="shrink-0"
                  />
                </Link>

                <DeactivateAdminButton
                  adminName={`${admin.first_name} ${admin.last_name}`}
                  userId={admin.user_id || 0}
                  currentUserId={currentUser?.id || ''}
                  adminStatus={admin.status}
                  onDeactivate={handleDeactivateAdmin}
                />
              </div>
            </td>
          </tr>
        ))}
      </ServerAdminTable>
    </div>
  );
}
