'use client';

import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { Button } from '@/components';
import { rebootChargingStation, getChargingStationById } from '@/lib/actions/charging-station-actions';

interface RebootChargingStationButtonProps {
  chargerId: number | undefined;
  chargerCode: string | undefined;
  serialNumber: string | undefined;
  status: string | undefined;
}

export default function RebootChargingStationButton({
  chargerId,
  chargerCode,
  serialNumber,
  status,
}: RebootChargingStationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isDisabled = isLoading || ['deactivated', 'inactive', 'maintenance'].includes(status?.toLowerCase() ?? '');

  const handleReboot = async () => {
    setIsLoading(true);
    let isBusy = false;
    try {
      if (chargerId) {
        const { data } = await getChargingStationById(String(chargerId));
        isBusy = data?.status?.toUpperCase() === 'BUSY';
      }
    } finally {
      setIsLoading(false);
    }

    const confirmMessage = isBusy
      ? `You are attempting to reboot the device below:\nCharger ${chargerCode} with SN ${serialNumber}\n\nThere is an ongoing charging detected!\n\nRebooting will disrupt the charging session. Proceed with reboot?`
      : `You are attempting to reboot the device below:\nCharger ${chargerCode} with SN ${serialNumber}\n\nNo ongoing charging detected. Proceed with reboot?`;

    const isConfirmed = window.confirm(confirmMessage);

    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      const result = await rebootChargingStation(chargerId);

      if (result === 'error' || (result as { errors?: { _form?: string[] } })?.errors?._form) {
        const message =
          (result as { errors?: { _form?: string[] } })?.errors?._form?.[0] ||
          'Failed to reboot charging station';
        showErrorToast(message);
      } else {
        showSuccessToast(`Charging station "${chargerCode}" reboot initiated`);
      }
    } catch {
      showErrorToast('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      icon="/icons/icon-refresh.svg"
      iconOnly
      className="shrink-0"
      onClick={handleReboot}
      disabled={isDisabled}
    />
  );
}
