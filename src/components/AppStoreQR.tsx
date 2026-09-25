'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Button from './Button';

interface AppStoreQRProps {
  appName?: string;
  iosAppId?: string; // Apple App Store ID (the number part of the URL)
  androidPackageName?: string; // Android package name (e.g., com.yourcompany.yourapp)
  fallbackUrl?: string; // Fallback URL if app stores aren't available
  className?: string;
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeDataUrl: string;
  appName: string;
  downloadText: string;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, qrCodeDataUrl, appName, downloadText }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-app-store-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${appName} - App Store QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                margin: 0; 
                padding: 20px;
                text-align: center;
              }
              .qr-container { 
                background: white; 
                padding: 30px; 
                border-radius: 12px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 400px;
              }
              .qr-code { 
                width: 250px; 
                height: 250px; 
                margin: 20px 0;
              }
              h1 { 
                color: #1f2937; 
                margin-bottom: 10px;
                font-size: 24px;
              }
              p { 
                color: #6b7280; 
                margin-bottom: 20px;
                font-size: 16px;
                line-height: 1.5;
              }
              @media print {
                body { 
                  margin: 0; 
                  padding: 10px;
                }
                .qr-container { 
                  box-shadow: none; 
                  border: 2px solid #e5e7eb;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>Download ${appName}</h1>
              <p>${downloadText}</p>
              <img class="qr-code" src="${qrCodeDataUrl}" alt="QR Code to download ${appName}" />
              <p><strong>Scan with your phone camera to download the app</strong></p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{appName} - App Store QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 mb-4">{downloadText}</p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrCodeDataUrl} 
              alt="QR Code" 
              className="mx-auto mb-3 w-64 h-64"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="text-sm text-gray-600">
              <strong>Scan with your phone camera to download the app</strong>
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={handleDownload}
              className="flex-1"
              label="Download QR Code"
            />
            <Button
              variant="primary"
              onClick={handlePrint}
              className="flex-1"
              label="Print QR Code"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AppStoreQR: React.FC<AppStoreQRProps> = ({
  appName = "Our Mobile App",
  iosAppId,
  androidPackageName,
  fallbackUrl = "https://your-website.com",
  className = ""
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Smart redirect URL that detects device and redirects appropriately
  const redirectUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/app-redirect?ios=${iosAppId || ''}&android=${androidPackageName || ''}&fallback=${encodeURIComponent(fallbackUrl)}`;

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsLoading(true);
        const dataUrl = await QRCode.toDataURL(redirectUrl, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          margin: 1,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          },
          width: 256
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [redirectUrl]);

  const handleQRClick = () => {
    setIsModalOpen(true);
  };

  const downloadText = `Scan this QR code with your phone to download ${appName} from the App Store or Google Play Store.`;

  if (isLoading) {
    return (
      <Button
        variant="secondary"
        icon="/icons/icon-qr.svg"
        iconOnly
        className={`shrink-0 opacity-50 cursor-not-allowed ${className}`}
        disabled
      />
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        icon="/icons/icon-qr.svg"
        iconOnly
        className={`shrink-0 ${className}`}
        onClick={handleQRClick}
      />
      
      <QRModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        qrCodeDataUrl={qrCodeDataUrl}
        appName={appName}
        downloadText={downloadText}
      />
    </>
  );
};
