'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function DChargeQRStatic() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // DCharge app configuration
  const appConfig = {
    appName: "DCharge",
    iosAppId: "6753014260",
    androidPackageName: "com.psr.holdings.dcharge",
    fallbackUrl: "https://www.dchargeapp.com/"
  };

  // Generate the redirect URL
  const redirectUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/app-redirect?ios=${appConfig.iosAppId}&android=${appConfig.androidPackageName}&fallback=${encodeURIComponent(appConfig.fallbackUrl)}`;

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsLoading(true);
        const dataUrl = await QRCode.toDataURL(redirectUrl, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          },
          width: 400
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

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `dcharge-app-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!qrCodeDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>DCharge App - QR Code</title>
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
                background: white;
              }
              .qr-container { 
                background: white; 
                padding: 40px; 
                border-radius: 16px; 
                border: 2px solid #e5e7eb;
                max-width: 500px;
              }
              .qr-code { 
                width: 300px; 
                height: 300px; 
                margin: 20px 0;
                border: 1px solid #e5e7eb;
              }
              h1 { 
                color: #1f2937; 
                margin-bottom: 10px;
                font-size: 32px;
                font-weight: bold;
              }
              .subtitle {
                color: #6b7280; 
                margin-bottom: 20px;
                font-size: 18px;
                line-height: 1.5;
              }
              .instructions {
                color: #374151;
                font-size: 16px;
                font-weight: 600;
                margin-top: 20px;
              }
              .app-info {
                color: #6b7280;
                font-size: 14px;
                margin-top: 15px;
                border-top: 1px solid #e5e7eb;
                padding-top: 15px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>📱 Download DCharge</h1>
              <p class="subtitle">Scan to download the official DCharge mobile app</p>
              <img class="qr-code" src="${qrCodeDataUrl}" alt="QR Code to download DCharge app" />
              <p class="instructions">📷 Scan with your phone camera</p>
              <div class="app-info">
                <p>Available on iOS App Store & Google Play Store</p>
                <p>www.dchargeapp.com</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-accent-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📱 DCharge App QR Code
          </h1>
          <p className="text-xl text-gray-600">
            Scan to download the DCharge mobile app
          </p>
        </div>

        {/* Main QR Code Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Generating QR Code...</p>
            </div>
          ) : (
            <>
              {/* QR Code Display */}
              <div className="mb-8">
                <div className="inline-block p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={qrCodeDataUrl} 
                    alt="DCharge App QR Code" 
                    className="w-80 h-80 mx-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  📷 How to Use
                </h2>
                <div className="text-gray-600 space-y-2">
                  <p>1. Open your phone&apos;s camera app</p>
                  <p>2. Point it at the QR code above</p>
                  <p>3. Tap the notification that appears</p>
                  <p>4. Download DCharge from your app store!</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download QR Code
                </button>
                
                <button
                  onClick={handlePrint}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print QR Code
                </button>
              </div>

              {/* App Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  📲 What happens when scanned?
                </h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-medium">📱 iPhone/iPad:</span>
                    <span>Apple App Store (Philippines)</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-medium">🤖 Android:</span>
                    <span>Google Play Store</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-medium">💻 Desktop/Other:</span>
                    <span>dchargeapp.com</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
