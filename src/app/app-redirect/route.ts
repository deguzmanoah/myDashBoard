import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const iosAppId = searchParams.get('ios');
  const androidPackageName = searchParams.get('android');
  const fallbackUrl = searchParams.get('fallback') || 'https://www.dchargeapp.com/';
  
  // Get user agent to detect device
  const userAgent = request.headers.get('user-agent') || '';
  
  // Detect iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  // Detect Android devices
  const isAndroid = /Android/.test(userAgent);
  
  // Generate redirect URL based on device
  let redirectUrl = fallbackUrl;
  
  if (isIOS && iosAppId) {
    // iOS App Store URL
    redirectUrl = `https://apps.apple.com/app/id${iosAppId}`;
  } else if (isAndroid && androidPackageName) {
    // Google Play Store URL
    redirectUrl = `https://play.google.com/store/apps/details?id=${androidPackageName}`;
  }
  
  // Create an HTML page that will redirect the user
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Download Our App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
        }
        .container {
          background: white;
          color: #333;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          max-width: 400px;
          width: 100%;
        }
        h1 {
          margin-bottom: 20px;
          font-size: 24px;
        }
        p {
          margin-bottom: 20px;
          color: #666;
          line-height: 1.6;
        }
        .btn {
          background: #007AFF;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          margin: 10px;
          transition: all 0.3s ease;
        }
        .btn:hover {
          background: #0056CC;
          transform: translateY(-2px);
        }
        .loading {
          font-size: 14px;
          color: #999;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📱 Download DCharge</h1>
        <p>You're being redirected to the app store to download the DCharge mobile application.</p>
        <div>
          <a href="${redirectUrl}" class="btn">Download Now</a>
        </div>
        ${isIOS && iosAppId ? '<p><small>Redirecting to Apple App Store...</small></p>' : ''}
        ${isAndroid && androidPackageName ? '<p><small>Redirecting to Google Play Store...</small></p>' : ''}
        ${!isIOS && !isAndroid ? '<p><small>Visit our website for more information...</small></p>' : ''}
      </div>
      
      <script>
        // Redirect immediately when page loads
        window.location.href = "${redirectUrl}";
      </script>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
