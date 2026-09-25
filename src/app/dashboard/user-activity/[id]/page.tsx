import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StatsCard, DeactivateCustomerButton } from '@/components';
import ServerAdminTable from '@/components/ServerAdminTable';
import { getCustomerById, updateCustomerStatus, type ApiCustomer } from '@/lib/actions/user-activity-actions';

interface CustomerDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Extended interface for UI with additional fields expected from the design
interface Vehicle {
  vehicle_id?: number | string;
  make?: string;
  model?: string;
  plate_number?: string;
  year?: string;
  kwh?: string[];
  connector_type?: string[];
}

interface ChargingSession {
  session_id?: string;
  date_time?: string;
  vehicle_used?: string;
  station_name?: string;
  location?: string;
  charger_type?: string;
  energy_used?: string;
  duration?: string;
  amount?: number;
  idle_fee?: number;
  status?: string;
}

interface ExtendedCustomer extends ApiCustomer {
  total_energy_used?: number;
  charging_sessions?: ChargingSession[];
}

export default async function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const { id } = await params;
  
  // Fetch customer data
  const result = await getCustomerById(id);
  
  if (result.error || !result.data) {
    notFound();
  }
  
  const customer = result.data as ExtendedCustomer;

  // Handler for deactivating customers
  const handleDeactivateCustomer = async (formData: FormData) => {
    'use server';
    return await updateCustomerStatus({}, formData);
  };

  const formatDate = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="space-y-5">
      {/* Header with Back Button and Disable User Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/user-activity"
            className="bg-[#DAE0E5] hover:bg-[#CAD0D5] p-2 rounded-full transition-colors"
          >
            <Image 
              src="/icons/icon-arrow-left.svg" 
              alt="Back" 
              width={24} 
              height={24} 
            />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">User Profile Summary</h1>
          </div>
        </div>
        <DeactivateCustomerButton
          customer={customer}
          onDeactivate={handleDeactivateCustomer}
        />
      </div>
      
      <div className='h-px bg-[#CAC4D0]'></div>

      {/* <DeactivateCustomerButton
        customer={customer}
        onDeactivate={handleDeactivateCustomer}
      /> */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Total Sessions"
          value={customer.total_transactions || 0}
          icon="/icons/icon-refresh.svg"
        />

        {/* <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div>
              <Image 
                src="/icons/icon-banknote.svg" 
                alt="Total Spent" 
                width={36}
                height={36}
                className="text-gray-600"
              />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                ₱{(customer.total_amount_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Spent</p>
            </div>
          </div>
        </div> */}

        <StatsCard
          title="Total Energy Used (kWh)"
          value={customer.total_energy_used || 0}
          icon="/icons/icon-bolt.svg"
        />
      </div>

      {/* User Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className='flex flex-col gap-4 col-span-2'>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={customer.user_id.toString()}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed font-mono focus:outline-none"
                style={{ borderColor: '#D9D9D9' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registered Date
              </label>
              <input
                type="text"
                value={formatDate(customer.registration_date)}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                style={{ borderColor: '#D9D9D9' }}
              />
            </div>
          </div>

          <div className='flex flex-col gap-4 col-span-3'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customer.customer_name}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                  style={{ borderColor: '#D9D9D9' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Status
                </label>
                <input
                  type="text"
                  value={customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                  style={{ borderColor: '#D9D9D9' }}
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={customer.email}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                  style={{ borderColor: '#D9D9D9' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile
                </label>
                <input
                  type="text"
                  value={customer.contact_number || 'N/A'}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                  style={{ borderColor: '#D9D9D9' }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Registered Vehicles */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 my-6">
          🚗 Registered Vehicles
        </h3>

        <ServerAdminTable
          headers={[
            'Car ID',
            'Vehicle Name',
            'Brand',
            'Model Year',
            'Plate No.',
            'Battery Capacity (kWh)',
            'Charger Type',
            'Connector Type'
          ]}
          currentPage={1}
          totalPages={1}
          itemsPerPage={customer.vehicles?.length || 0}
          totalItems={customer.vehicles?.length || 0}
          startIndex={0}
          endIndex={customer.vehicles?.length || 0}
        >
          {customer.vehicles && customer.vehicles.length > 0 ? (
            (customer.vehicles as Vehicle[]).map((vehicle: Vehicle, index: number) => (
              <tr key={vehicle.vehicle_id || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {vehicle.vehicle_id || `VEH-${String(index + 1).padStart(3, '0')}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.make || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.year || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.plate_number || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.kwh ? vehicle.kwh.join(' / ') + ' kWh' : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.connector_type ? vehicle.connector_type.join(', ') : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex gap-1">
                    {vehicle.connector_type ? (
                      vehicle.connector_type.map((type: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded border text-xs">
                          {type}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 rounded border text-xs">N/A</span>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                No vehicles registered
              </td>
            </tr>
          )}
        </ServerAdminTable>
      </div>

      {/* Charging Session Activity */}
      <div className='hidden'>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 my-6">
          🔌 Charging Session Activity
        </h3>

        <ServerAdminTable
          headers={[
            'Session ID',
            'Date & Time',
            'Vehicle Used',
            'Station Name',
            'Location',
            'Charger Type',
            'Energy Used (kWh)',
            'Duration (min)',
            // 'Amount (₱)',
            // 'Idle Fee (₱)',
            'Status'
          ]}
          currentPage={1}
          totalPages={1}
          itemsPerPage={customer.charging_sessions?.length || 0}
          totalItems={customer.charging_sessions?.length || 0}
          startIndex={0}
          endIndex={customer.charging_sessions?.length || 0}
        >
          {customer.charging_sessions && customer.charging_sessions.length > 0 ? (
            customer.charging_sessions.map((session: ChargingSession, index: number) => (
              <tr key={session.session_id || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {session.session_id || `S-${String(index + 1).padStart(4, '0')}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(session.date_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.vehicle_used || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.station_name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-[150px] truncate">
                  {session.location || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.charger_type || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.energy_used || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.duration || 'N/A'}
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₱{session.amount?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₱{session.idle_fee?.toFixed(2) || '0.00'}
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    session.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    session.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    session.status === 'Failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status || 'Unknown'}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                No charging sessions found
              </td>
            </tr>
          )}
        </ServerAdminTable>
      </div>
    </div>
  );
}
