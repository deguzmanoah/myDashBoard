'use client';

import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { Button } from '@/components';
import { ApiChargingStation, ChargingStationFormState } from '@/lib/actions/charging-station-actions';

interface DeactivateChargingStationButtonProps {
  station: ApiChargingStation;
  onDeactivate: (formData: FormData) => Promise<ChargingStationFormState>;
}

export default function DeactivateChargingStationButton({
  station,
  onDeactivate,
}: DeactivateChargingStationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isConfirmed = window.confirm(
      `Are you sure you want to make the charging station "${station.charger_code}" inactive?`
    );
    
    if (isConfirmed) {
      setIsLoading(true);
      
      try {
        const formData = new FormData();
        formData.set('charger_id', station.charger_id?.toString() || '');
        formData.set('charger_code', station.charger_code);
        formData.set('charger_type', station.charger_type);
        formData.set('power_output', station.power_output);
        formData.set('branch_id', station.branch_id.toString());
        formData.set('pricing_id', station.pricing_id.toString());
        formData.set('brand', station.brand);
        formData.set('manufacturer_location', station.manufacturer_location);
        formData.set('installation_date', station.installation_date);
        formData.set('warranty_expiration_date', station.warranty_expiration_date);
        formData.set('firmware_version', station.firmware_version);
        formData.set('serial_number', station.serial_number);
        formData.set('status', 'Inactive');

        const result = await onDeactivate(formData);
        
        if (result?.errors?._form) {
          showErrorToast(result.errors._form[0]);

        } else if (result?.errors) {
          // Handle other validation errors
          const errorMessages = Object.values(result.errors).flat();
          showErrorToast(errorMessages[0] || 'An error occurred');

        } else if (result?.success) {
          // Success case - show success toast and refresh
          showSuccessToast(`Charging station "${station.charger_code}" has been made inactive`);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('Error deactivating charging station:', error);
        showErrorToast('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isDisabled = station.status.toLowerCase() === 'inactive' || isLoading;

  return (
    <form onSubmit={handleSubmit} className="inline">
      <Button
        variant="secondary" 
        icon="/icons/icon-delete.svg"
        iconOnly
        className="shrink-0 border-charge-red"
        type="submit"
        disabled={isDisabled}
      />
    </form>
  );
}
