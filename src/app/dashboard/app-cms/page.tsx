'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminToolsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to FAQs by default since we now use submenus
    router.push('/dashboard/app-cms/faqs');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-gray-600 mb-4">Redirecting to App CMS...</div>
      </div>
    </div>
  );
}
