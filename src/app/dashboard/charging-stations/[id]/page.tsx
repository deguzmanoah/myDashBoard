'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ChargingStationForm, { ChargingStationFormData } from '@/components/ChargingStationForm';
import { useAuth } from '@/hooks/useAuth';
import { getChargingStationById } from '@/lib/actions/charging-station-actions';

export default function EditStationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const stationId = params.id as string;
  
  const [initialData, setInitialData] = useState<Partial<ChargingStationFormData> | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStationData = async () => {
      try {
        const result = await getChargingStationById(stationId);
        
        if (result.data) {
          const station = result.data;
          setInitialData({
            charger_id: station.charger_id?.toString() || '',
            charger_code: station.charger_code,
            charger_type: station.charger_type as 'AC' | 'DC',
            power_output: station.power_output?.toString() || '',
            pricing_id: station.pricing_id?.toString() || '',
            brand: station.brand,
            manufacturer_location: station.manufacturer_location,
            installation_date: station.installation_date ? station.installation_date.split('T')[0] : '',
            warranty_expiration_date: station.warranty_expiration_date ? station.warranty_expiration_date.split('T')[0] : '',
            firmware_version: station.firmware_version,
            serial_number: station.serial_number,
            status: station.status as 'Active' | 'Deactivated' | 'Maintenance' | 'Error',
            branch_id: station.branch_id?.toString() || '',
            charger_location_image: null,
            connectors: station.connectors?.map(connector => ({
              connector_id: connector.connector_id?.toString(),
              connector_code: connector.connector_code || '',
              ocpp_connector_number: connector.ocpp_connector_number || '',
              qr_code: connector.qr_code || '',
              status: connector.status as 'Active' | 'Deactivated' | 'Maintenance' | 'Error'
            })) || []
          });
        } else {
          console.error('Failed to fetch station:', result.error);
          router.push('/dashboard/charging-stations');
        }
      } catch (error) {
        console.error('Error fetching charging station:', error);
        router.push('/dashboard/charging-stations');
      } finally {
        setLoading(false);
      }
    };

    fetchStationData();
  }, [stationId, router]);

  const handleCancel = () => {
    router.push('/dashboard/charging-stations');
  };

  if (!user?.id) {
    return null; // or loading state
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index}>
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return null; // This shouldn't happen due to redirect logic above
  }

  return (
    <ChargingStationForm
      initialData={initialData}
      isEditing={true}
      onCancel={handleCancel}
      currentUserId={user.id}
    />
  );
}
