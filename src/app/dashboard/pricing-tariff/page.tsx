import React from 'react';
import Link from 'next/link';

import { Button, PageHeader, InactivatePricingButton } from '@/components';
import ServerTableActionBar from '@/components/ServerTableActionBar';
import ServerAdminTable from '@/components/ServerAdminTable';
import { getStatusColor } from '@/constants';

import { getPricings, updatePricing, type ApiPricing, exportPricingAsCSV } from '@/lib/actions/pricing-actions';
import { getUserData } from '@/lib/actions/auth-actions';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

type TransformedPricing = ApiPricing & { id?: string };

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

export default async function PricingTariffPage({
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
  let pricings: TransformedPricing[] = [];
  let totalItems = 0;
  let pricingStatuses: readonly string[] = [];
  let error: string | null = null;
  
  try {
    const result = await getPricings({
      page: currentPage,
      limit: itemsPerPage,
      status: selectedStatus,
      search: searchQuery,
    });
    pricings = result.pricings;
    totalItems = result.totalItems;
    pricingStatuses = result.pricingStatuses;
  } catch (fetchError) {
    console.error('Failed to fetch pricings:', fetchError);
    error = 'Failed to load pricing data. Please try again later.';
    // Set defaults for error state
    const { pricingStatuses: fallbackStatuses } = await import('@/data/mockPricings');
    pricingStatuses = fallbackStatuses;
  }

  // Show error fallback if there was an error
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Get current logged-in user data
  const currentUser = await getUserData();

  // Create a bound updatePricing function for form action
  const handleInactivatePricing = async (formData: FormData) => {
    'use server';
    // Add the current user ID to the form data
    formData.set('admin_id', currentUser?.id || '');
    return await updatePricing({}, formData);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const tableHeaders = [
    'Pricing ID',
    'Name',
    'Cost per kWh (₱)',
    'Rate per Min (₱)',
    'Idle Fee (₱/min)',
    'Admin Fee (₱/min)',
    'Status',
    'Action'
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pricing & Tariff"
        description="Manage pricing structures and tariff rates for charging services."
      >
        <Link href="/dashboard/pricing-tariff/add-tariff">
          <Button 
            label="Add Pricing"
            variant="primary" 
            icon="/icons/icon-plus.svg"
          />
        </Link>
      </PageHeader>

      <ServerTableActionBar
        filters={pricingStatuses}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
        searchPlaceholder="Search for pricing name..."
        showExportButton={true}
        showMoreButton={false}
        exportAction={exportPricingAsCSV}
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
        {pricings.map((pricing, index) => (
          <tr key={index}>
            <td className="sticky left-0 z-10 bg-white whitespace-nowrap border-inset-r px-6 py-4">
              <div className="font-medium">
                {pricing.pricing_id}
              </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {pricing.name}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              ₱{pricing.cost.toFixed(2)}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              ₱{pricing.rate.toFixed(2)}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              ₱{pricing.idle.toFixed(2)}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              ₱{pricing.admin_fee.toFixed(2)}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-3 py-1 text-xs rounded-full ${
                getStatusColor(pricing.status)
              }`}>
                {pricing.status}
              </span>
            </td>

            <td className='px-4 min-w-[150px]'>
              <div className='flex items-center gap-2'>
                <Link href={`/dashboard/pricing-tariff/${pricing.pricing_id}`}>
                  <Button
                    variant="secondary" 
                    icon="/icons/icon-pencil.svg"
                    iconOnly
                    className="shrink-0"
                  />
                </Link>

                <InactivatePricingButton
                  pricing={pricing}
                  onInactivate={handleInactivatePricing}
                />
              </div>
            </td>
          </tr>
        ))}
      </ServerAdminTable>
    </div>
  );
}
