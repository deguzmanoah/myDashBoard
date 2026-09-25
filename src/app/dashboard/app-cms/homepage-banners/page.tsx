import React from 'react';
import Link from 'next/link';

import { Button, PageHeader, BannerCard, BannerPagination } from '@/components';
import ServerTableActionBar from '@/components/ServerTableActionBar';
import { getBanners, type ApiBanner } from '@/lib/actions/homepage-banners-actions';

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

interface HomepageBannersPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function HomepageBannersPage({ searchParams }: HomepageBannersPageProps) {
  // Await searchParams before accessing its properties
  const params = await searchParams;
  
  // Extract state from URL search params
  const selectedStatus = (params?.status as string) || 'All';
  const searchQuery = (params?.search as string) || '';
  const currentPage = Number(params?.page) || 1;
  const itemsPerPage = Number(params?.limit) || 6; // Use 6 for grid layout

  // Server-side data fetching
  let banners: ApiBanner[] = [];
  let totalItems = 0;
  let totalPages = 0;
  const bannerStatuses = ['All', 'Published', 'Draft'];
  let error: string | null = null;
  
  try {
    const result = await getBanners({
      page: currentPage,
      limit: itemsPerPage,
      status: selectedStatus,
      search: searchQuery,
    });
    banners = result.banners;
    totalItems = result.totalItems;
    totalPages = result.totalPages;
  } catch (fetchError) {
    console.error('Failed to fetch banners:', fetchError);
    error = 'Failed to load banner data. Please try again later.';
  }

  // Show error fallback if there was an error
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Homepage Banners"
        description="Manage banners displayed on the app's homepage"
      >
        <Link href="/dashboard/app-cms/homepage-banners/add">
          <Button 
            label="Add Banner"
            variant="primary" 
            icon="/icons/icon-plus.svg"
          />
        </Link>
      </PageHeader>

      <ServerTableActionBar
        filters={bannerStatuses}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
      />

      {/* Banner Grid */}
      <div className="space-y-6">
        {banners.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center text-gray-500">
              <p className="text-lg">No banners found</p>
              <p className="mt-2">
                {searchQuery || selectedStatus !== 'All' 
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Start by adding your first banner.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <BannerCard key={banner.id} banner={banner} />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <BannerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                selectedFilter={selectedStatus}
                searchQuery={searchQuery}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
