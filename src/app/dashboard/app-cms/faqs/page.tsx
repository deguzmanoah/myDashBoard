import React from 'react';
import Link from 'next/link';

import { Button, PageHeader, DeactivateFAQButton } from '@/components';
import ServerTableActionBar from '@/components/ServerTableActionBar';
import ServerAdminTable from '@/components/ServerAdminTable';
import { getStatusColor } from '@/constants';

import { getFAQs, updateFAQ, type ApiFAQ } from '@/lib/actions/faq-actions';
import { getUserData } from '@/lib/actions/auth-actions';
import { stripHtml } from '@/lib/utils/text-helpers';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

type TransformedFAQ = ApiFAQ & { 
  id?: string;
  faq_id?: number;
};

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

interface FAQPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function FAQPage({ searchParams }: FAQPageProps) {
  // Await searchParams before accessing its properties
  const params = await searchParams;
  
  // Extract state from URL search params
  const selectedStatus = (params?.status as string) || 'All';
  const searchQuery = (params?.search as string) || '';
  const currentPage = Number(params?.page) || 1;
  const itemsPerPage = Number(params?.limit) || 10;

  // Server-side data fetching
  let faqs: TransformedFAQ[] = [];
  let totalItems = 0;
  let faqStatuses: readonly string[] = [];
  let error: string | null = null;
  
  try {
    const result = await getFAQs({
      page: currentPage,
      limit: itemsPerPage,
      status: selectedStatus,
      search: searchQuery,
    });
    faqs = result.faqs as TransformedFAQ[];
    totalItems = result.totalItems;
    faqStatuses = result.faqStatuses;
  } catch (fetchError) {
    console.error('Failed to fetch FAQs:', fetchError);
    error = 'Failed to load FAQ data. Please try again later.';
    // Set defaults for error state
    const { faqStatuses: fallbackStatuses } = await import('@/data/mockFAQs');
    faqStatuses = fallbackStatuses;
  }

  // Show error fallback if there was an error
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Get current logged-in user data
  const currentUser = await getUserData();

  // Create a bound updateFAQ function for form action
  const handleDeactivateFAQ = async (formData: FormData): Promise<void> => {
    'use server';
    // Add the current user ID to the form data
    formData.set('admin_id', currentUser?.id || '');
    await updateFAQ({}, formData);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const tableHeaders = [
    'ID',
    'Order',
    'Question',
    'Category', 
    'Status',
    'Last Updated',
    'Created By',
    'Action'
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    }).replace(' ', '');
    return `${year}-${month}-${day} ${time}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Frequently Asked Questions"
        description="Manage FAQ content for the mobile application."
      >
        <Link href="/dashboard/app-cms/add-faq">
          <Button 
            label="Add FAQ"
            variant="primary" 
            icon="/icons/icon-plus.svg"
          />
        </Link>
      </PageHeader>

      <ServerTableActionBar
        filters={faqStatuses}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
        searchPlaceholder="Search FAQs..."
        showExportButton={true}
        showMoreButton={false}
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
        {faqs.map((faq, index) => (
          <tr key={faq.id || faq.faq_id || index}>
            <td className="sticky left-0 z-10 bg-white whitespace-nowrap border-inset-r px-6 py-4">
              <div className="font-medium">
                {faq.id || faq.faq_id}
              </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <div className="font-medium">
                {faq.order || '-'}
              </div>
            </td>

            <td className="px-6 py-4 text-sm max-w-xs">
              <div className="font-medium truncate">
                {faq.question}
              </div>
              <div className="text-gray-500 text-xs truncate">
                {stripHtml(faq.answer)}
              </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {faq.category}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-3 py-1 text-xs rounded-full ${
                getStatusColor(faq.status)
              }`}>
                {faq.status}
              </span>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {formatDate(faq.last_updated || faq.updated_date || faq.created_date || '')}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {faq.admin_name}
            </td>

            <td className='px-4 min-w-[150px]'>
              <div className='flex items-center gap-2'>
                <Link href={`/dashboard/app-cms/edit-faq/${faq.id || faq.faq_id}`}>
                  <Button
                    variant="secondary"
                    icon="/icons/icon-pencil.svg"
                    iconOnly
                    className="shrink-0"
                  />
                </Link>

                <DeactivateFAQButton
                  faq={{
                    id: faq.id || faq.faq_id || '',
                    question: faq.question,
                    status: faq.status,
                    answer: faq.answer,
                    answer_json: faq.answer_json,
                    category: faq.category,
                    order: faq.order,
                  }}
                  onDeactivate={handleDeactivateFAQ}
                />
              </div>
            </td>
          </tr>
        ))}
      </ServerAdminTable>
    </div>
  );
}
