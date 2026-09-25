'use client';

import React from 'react';
import Image from 'next/image';
import Button from './Button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  connector: {
    connector_id?: string;
    connector_code: string;
    ocpp_connector_number?: string;
    qr_code?: string;
  } | null;
  station: {
    charger_id?: number;
    station_name: string;
    address: string;
    city: string;
    charger_code?: string;
  } | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, connector, station }) => {
  if (!isOpen || !connector || !station) return null;

  const handlePrint = () => {
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${connector.connector_code}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .qr-container { 
                border: 2px solid #333; 
                border-radius: 10px; 
                padding: 20px; 
                margin: 20px auto;
                max-width: 300px;
                background: white;
              }
              .qr-code { 
                width: 200px; 
                height: 200px; 
                margin: 20px auto;
                display: block;
              }
              h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
              .details { color: #666; font-size: 14px; margin: 10px 0; }
              .instruction { color: #888; font-size: 12px; margin-top: 15px; }
              @media print {
                body { margin: 0; }
                .qr-container { 
                  border: 3px solid #000; 
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>${connector.connector_code}</h1>
              <div class="details">Station: ${station.station_name}</div>
              ${connector.ocpp_connector_number ? `<div class="details">OCPP: ${connector.ocpp_connector_number}</div>` : ''}
              <div class="details">${station.address}, ${station.city}</div>
              <img class="qr-code" src="${connector.qr_code || '/icons/icon-qr.svg'}" alt="QR Code" />
              <div class="instruction">Scan this QR code to access this connector</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait a bit for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            QR Code - {connector.connector_code}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="text-center">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Connector: {connector.connector_code}</p>
              {connector.ocpp_connector_number && (
                <p className="text-sm text-gray-600 mb-2">OCPP Number: {connector.ocpp_connector_number}</p>
              )}
              <p className="text-sm text-gray-600 mb-2">Station: {station.station_name}</p>
              <p className="text-sm text-gray-600 mb-4">
                Location: {station.address}, {station.city}
              </p>
            </div>
            
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 shadow-lg">
                <Image 
                  src={connector.qr_code || '/icons/icon-qr.svg'} 
                  alt="QR Code" 
                  width={180}
                  height={180}
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Scan this QR code to access this connector
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          {connector.qr_code &&
            <Button
              label="Print QR Code"
              variant="secondary"
              icon="/icons/icon-download-cloud.svg"
              onClick={handlePrint}
            />
          }

          <Button
            label="Close"
            variant="primary"
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
};
