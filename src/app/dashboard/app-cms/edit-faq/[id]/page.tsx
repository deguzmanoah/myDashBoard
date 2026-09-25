import React from 'react';
import { getFAQById } from '@/lib/actions/faq-actions';
import EditFAQClient from './EditFAQClient';

interface EditFAQPageProps {
  params: Promise<{ id: string }>;
}

interface ErrorFallbackProps {
  error: string;
  onBack?: () => void;
}

function ErrorFallback({ error }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">Error Loading FAQ</div>
        <div className="text-gray-600 mb-4">{error}</div>
        <a
          href="/dashboard/app-cms/faqs"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
        >
          Back to FAQs
        </a>
      </div>
    </div>
  );
}

function NotFoundFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">FAQ Not Found</div>
        <div className="text-gray-600 mb-4">The FAQ you&apos;re looking for doesn&apos;t exist.</div>
        <a
          href="/dashboard/app-cms/faqs"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
        >
          Back to FAQs
        </a>
      </div>
    </div>
  );
}

export default async function EditFAQPage({ params }: EditFAQPageProps) {
  // Await params to get the ID
  const { id } = await params;

  // Server-side data fetching
  const result = await getFAQById(id);

  // Handle errors
  if (result.error) {
    return <ErrorFallback error={result.error} />;
  }

  // Handle not found
  if (!result.data) {
    return <NotFoundFallback />;
  }

  const faq = result.data;

  // Transform API data to match form structure
  const initialData = {
    id: (faq.id || '').toString(),
    question: faq.question,
    answer: faq.answer,
    answer_json: faq.answer_json,
    category: faq.category,
    status: faq.status as 'Active' | 'Inactive',
    order: (faq.order || 1).toString(),
  };

  return (
    <EditFAQClient 
      initialData={initialData}
      isEditing={true}
    />
  );
}
