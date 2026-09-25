import { AppStoreQR } from '@/components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DCharge QR Code Generator - Internal Use',
  description: 'Internal QR code generation for DCharge mobile app',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function DChargeQRPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            DCharge App QR Code Generator
          </h1>
          <p className="text-lg text-gray-600">
            Generate QR codes for users to download the DCharge mobile app
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-1 max-w-2xl mx-auto">
          {/* Production DCharge QR */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              📱 Download DCharge App
            </h2>
            <p className="text-gray-600 mb-6">
              Click the QR code button below to generate a QR code that automatically redirects users to the correct app store based on their device.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <AppStoreQR
                  appName="DCharge"
                  iosAppId="6753014260"
                  androidPackageName="com.psr.holdings.dcharge"
                  fallbackUrl="https://www.dchargeapp.com/"
                  className="mx-auto"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Generate QR Code
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">App Store Links:</h3>
              <div className="text-sm space-y-1">
                <p><strong>iOS:</strong> https://apps.apple.com/ph/app/dcharge/id6753014260</p>
                <p><strong>Android:</strong> https://play.google.com/store/apps/details?id=com.psr.holdings.dcharge</p>
                <p><strong>Fallback:</strong> https://www.dchargeapp.com/</p>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              🚀 Ready for Friday Launch!
            </h3>
            <div className="text-sm text-blue-700 space-y-3">
              <p><strong>What happens when users scan:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>iPhone/iPad users → Apple App Store (Philippines)</li>
                <li>Android users → Google Play Store</li>
                <li>Desktop/other devices → https://www.dchargeapp.com/</li>
              </ul>
              
              <p className="pt-2"><strong>Perfect for:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Printing on marketing materials</li>
                <li>Displaying on charging stations</li>
                <li>Including in emails and social media</li>
                <li>Adding to your website</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-12 bg-gray-900 text-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            💻 Use anywhere in your app:
          </h3>
          <pre className="text-sm overflow-x-auto">
            <code>{`import { AppStoreQR } from '@/components';

<AppStoreQR
  appName="DCharge"
  iosAppId="6753014260"
  androidPackageName="com.psr.holdings.dcharge"
  fallbackUrl="https://www.dchargeapp.com/"
/>`}</code>
          </pre>
        </div>

        {/* Marketing Suggestions */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            📈 Launch Day Marketing Ideas:
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
            <div>
              <p><strong>Physical Locations:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Print QR codes for each charging station</li>
                <li>Include in vehicle registration areas</li>
                <li>Add to parking area signage</li>
              </ul>
            </div>
            <div>
              <p><strong>Digital Marketing:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Social media posts and stories</li>
                <li>Email newsletter campaigns</li>
                <li>Website download section</li>
                <li>Digital billboards/screens</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
