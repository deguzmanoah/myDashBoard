'use client';

import React, { useState } from 'react';
import { QRCodeModal } from './QRCodeModal';
import Button from './Button';

interface ChargingStationQRProps {
  station: {
    charger_id?: number;
    charger_code?: string;
    station_name?: string;
    address?: string;
    city?: string;
    connectors?: Array<{
      connector_id?: number;
      connector_code: string;
      ocpp_connector_number?: string;
      qr_code?: string;
    }>;
  };
}

export const ChargingStationQR: React.FC<ChargingStationQRProps> = ({ station }) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<{
    connector_id?: string;
    connector_code: string;
    ocpp_connector_number?: string;
    qr_code?: string;
  } | null>(null);

  // Get the first connector with a QR code, or the first connector
  const availableConnector = station.connectors?.find(c => c.qr_code) || station.connectors?.[0];
  
  // Don't show QR button if no connectors
  if (!availableConnector) {
    return null;
  }

  const handleQRCodeClick = () => {
    setSelectedConnector({
      connector_id: availableConnector.connector_id?.toString(),
      connector_code: availableConnector.connector_code,
      ocpp_connector_number: availableConnector.ocpp_connector_number,
      qr_code: availableConnector.qr_code
    });
    setIsQRModalOpen(true);
  };

  const handleCloseQRModal = () => {
    setIsQRModalOpen(false);
    setSelectedConnector(null);
  };

  return (
    <>
      <Button
        variant="secondary"
        icon="/icons/icon-qr.svg"
        iconOnly
        className="shrink-0"
        onClick={handleQRCodeClick}
      />
      
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={handleCloseQRModal}
        connector={selectedConnector}
        station={{
          charger_id: station.charger_id,
          station_name: station.station_name || station.charger_code || 'Unknown Station',
          address: station.address || 'Unknown Address',
          city: station.city || 'Unknown City'
        }}
      />
    </>
  );
};
