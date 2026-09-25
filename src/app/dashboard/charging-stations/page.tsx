import React from 'react';
import Link from 'next/link';

import { Button, PageHeader, DeactivateChargingStationButton, ChargingStationQR, RebootChargingStationButton } from '@/components';
import ServerTableActionBar from '@/components/ServerTableActionBar';
import ServerAdminTable from '@/components/ServerAdminTable';
import { getStatusColor } from '@/constants';

import {
  getChargingStations,
  updateChargingStation,
  type ApiChargingStation,
  exportChargingStationsAsCSV
} from '@/lib/actions/charging-station-actions';
import { getUserData } from '@/lib/actions/auth-actions';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

type TransformedChargingStation = ApiChargingStation & { id?: string };

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

export default async function ChargingStationsPage({
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
  let chargingStations: TransformedChargingStation[] = [];
  let totalItems = 0;
  let chargingStationStatuses: readonly string[] = [];
  let error: string | null = null;
  
  try {
    const result = await getChargingStations({
      page: currentPage,
      limit: itemsPerPage,
      status: selectedStatus,
      search: searchQuery,
    });
    chargingStations = result.chargingStations;
    totalItems = result.totalItems;
    chargingStationStatuses = result.chargingStationStatuses;
  } catch (fetchError) {
    console.error('Failed to fetch charging stations:', fetchError);
    error = 'Failed to load charging station data. Please try again later.';
    // Set defaults for error state
    const { chargingStationStatuses: fallbackStatuses } = await import('@/data/mockChargingStations');
    chargingStationStatuses = fallbackStatuses;
  }

  // Show error fallback if there was an error
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Get current logged-in user data
  const currentUser = await getUserData();

  // Create a bound updateChargingStation function for form action
  const handleDeactivateStation = async (formData: FormData) => {
    'use server';
    // Add the current user ID to the form data
    formData.set('admin_id', currentUser?.id || '');
    return await updateChargingStation({}, formData);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const tableHeaders = [
    'Charger Code',
    'Charger Type',
    'Connectors',
    'Serial Number',
    'Status',
    'Action'
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Charging Stations"
        description="Manage charging stations across your network and monitor their status."
      >
        <Link href="/dashboard/charging-stations/add-station">
          <Button 
            label="Add Station"
            variant="primary" 
            icon="/icons/icon-plus.svg"
          />
        </Link>
      </PageHeader>

      <ServerTableActionBar
        filters={chargingStationStatuses}
        selectedFilter={selectedStatus}
        searchQuery={searchQuery}
        searchPlaceholder="Search for charger code, brand, or type..."
        showExportButton={true}
        showMoreButton={false}
        exportAction={exportChargingStationsAsCSV}
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
        {chargingStations.map((station, index) => (
          <tr key={index}>
            <td className="sticky left-0 z-10 bg-white whitespace-nowrap border-inset-r px-6 py-4 min-w-[120px]">
              <div className="font-medium">
                {station.charger_code}
              </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {station.charger_type}
            </td>

            <td className="px-6 py-4">
              <div className="space-y-1">
                {station.connectors && station.connectors.length > 0 ? (
                  station.connectors.map((connector, connectorIndex) => (
                    <div key={connector.connector_id || connectorIndex} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{connector.connector_code}:</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                        getStatusColor(connector.status || 'Available')
                      }`}>
                        {connector.status || 'Available'}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No connectors</span>
                )}
              </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {station.serial_number || '-'}
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-3 py-1 text-xs rounded-full ${
                getStatusColor(station.status || 'Active')
              }`}>
                {station.status || 'Active'}
              </span>
            </td>

            <td className='px-4 min-w-[200px]'>
              <div className='flex items-center gap-2'>
                {/* QR component now works with connector-level data */}
                {/* {station.connectors && station.connectors.length > 0 && (
                  <ChargingStationQR station={station} />
                )} */}

                <RebootChargingStationButton
                  chargerId={station.charger_id}
                  chargerCode={station.charger_code}
                  serialNumber={station.serial_number}
                  status={station.status}
                />

                <Link href={`/dashboard/charging-stations/${station.charger_id}`}>
                  <Button
                    variant="secondary" 
                    icon="/icons/icon-pencil.svg"
                    iconOnly
                    className="shrink-0"
                  />
                </Link>

                <DeactivateChargingStationButton
                  station={station}
                  onDeactivate={handleDeactivateStation}
                />
              </div>
            </td>
          </tr>
        ))}
      </ServerAdminTable>
    </div>
  );
}
