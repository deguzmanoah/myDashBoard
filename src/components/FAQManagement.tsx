'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FAQManagementProps {
  className?: string;
}

export default function FAQManagement({ className = '' }: FAQManagementProps) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dedicated FAQ page that can use server components
    router.push('/dashboard/app-cms/faqs');
  }, [router]);

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className="text-center">
        <div className="text-gray-600 mb-4">Redirecting to FAQ management...</div>
      </div>
    </div>
  );
}
