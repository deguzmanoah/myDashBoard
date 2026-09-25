import React from 'react';
import Link from 'next/link';

import { Button, PageHeader, DeactivateNotificationButton, DuplicateNotificationButton } from '@/components';
import ServerTableActionBar from '@/components/ServerTableActionBar';
import ServerAdminTable from '@/components/ServerAdminTable';

import { getNotifications, updateNotification, type ApiNotification, exportNotificationsAsCSV } from '@/lib/actions/notification-actions';
import { getUserData } from '@/lib/actions/auth-actions';
import { stripHtml } from '@/lib/utils/text-helpers';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

type TransformedNotification = ApiNotification & { id?: string | number };

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

export default async function NotificationsPage({
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
  let notifications: TransformedNotification[] = [];
  let totalItems = 0;
  let notificationStatuses: readonly string[] = [];
  let error: string | null = null;
  
  try {
    const result = await getNotifications({
      page: currentPage,
      limit: itemsPerPage,
      status: selectedStatus,
      search: searchQuery,
    });
    notifications = result.notifications as TransformedNotification[];
    totalItems = result.totalItems;
    notificationStatuses = result.notificationStatuses;
  } catch (fetchError) {
    console.error('Failed to fetch notifications:', fetchError);
    error = 'Failed to load notification data. Please try again later.';
    // Set defaults for error state
    const { notificationStatuses: fallbackStatuses } = await import('@/data/mockNotifications');
    notificationStatuses = ['All', ...fallbackStatuses];
  }

  // Show error fallback if there was an error
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Get current logged-in user data
  const currentUser = await getUserData();

  // Create a bound updateNotification function for form action
  const handleDeactivateNotification = async (formData: FormData) => {
    'use server';
    // Add the current user ID to the form data
    formData.set('admin_id', currentUser?.id || '');
    return await updateNotification({}, formData);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const tableHeaders = [
    'ID',
    'Title',
    'Target Audience',
    'Type',
    'Priority',
    'Send At',
    'Status',
    'Action'
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Manage and send notifications to users across the platform."
      >
        <Link href="/dashboard/notifications/add-notification">
          <Button 
            label="Add Notification"
            variant="primary" 
            icon="/icons/icon-plus.svg"
          />
        </Link>
      </PageHeader>

      <ServerTableActionBar
        filters={notificationStatuses}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
        searchPlaceholder="Search for notification title..."
        showExportButton={true}
        showMoreButton={false}
        exportAction={exportNotificationsAsCSV}
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
        {notifications.map((notification, index) => (
          <tr key={index}>
            <td className="sticky left-0 z-10 bg-white whitespace-nowrap border-inset-r px-6 py-4">
              <div className="font-medium">
                {notification.id}
              </div>
            </td>

            <td className="px-6 py-4 text-sm max-w-xs">
              <div className="font-medium truncate">
                {notification.title}
              </div>
              <div className="text-gray-500 text-xs truncate">
                {stripHtml(notification.message)}
              </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {notification.target_audience}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {notification.type}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {notification.priority}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {notification.send_at 
                ? (() => {
                    const date = new Date(notification.send_at);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const time = date.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit', 
                      hour12: true 
                    }).replace(' ', '');
                    return `${year}-${month}-${day} ${time}`;
                  })()
                : '-'
              }
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {notification.status}
            </td>

            <td className='px-4 min-w-[150px]'>
              <div className='flex items-center gap-2'>
                <DuplicateNotificationButton
                  notificationId={notification.id || ''}
                />

                {(notification.status !== 'Sent' && notification.status !== 'Archived') && (
                  <Link href={`/dashboard/notifications/${notification.id}`}>
                    <Button
                      variant="secondary"
                      icon="/icons/icon-pencil.svg"
                      iconOnly
                      className="shrink-0"
                    />
                  </Link>
                )}

                <DeactivateNotificationButton
                  notification={notification}
                  onDeactivate={handleDeactivateNotification}
                />
              </div>
            </td>
          </tr>
        ))}
      </ServerAdminTable>
    </div>
  );
}
