import { getTermsConditions } from '@/lib/actions/terms-conditions-actions';
import { notFound } from 'next/navigation';
import PublicPageLayout from '@/components/PublicPageLayout';

// Force dynamic rendering to ensure fresh content from CMS
export const dynamic = 'force-dynamic';

export default async function PublicTermsConditionsPage() {
  // Fetch published terms and conditions data using public API
  const result = await getTermsConditions(true);

  // Handle error or unpublished case
  if (!result.success || !result.data) {
    // For development/demo purposes, show a placeholder if no published content
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      return (
        <PublicPageLayout title="Terms and Conditions" lastUpdated="Demo Content">
          <div className="text-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Demo Content</h3>
            <p className="text-yellow-700 mb-4">
              No published terms and conditions found. This is demo content for development.
            </p>
            <p className="text-sm text-yellow-600">
              To see real content: Go to Dashboard → App CMS → Terms &amp; Conditions, add content, and mark it as &quot;Published&quot;
            </p>
          </div>
        </PublicPageLayout>
      );
    }
    
    notFound();
  }

  const { title, body } = result.data;
  const lastUpdated = result.data.updated_date 
    ? new Date(result.data.updated_date).toLocaleDateString() 
    : undefined;

  return (
    <PublicPageLayout title={title} lastUpdated={lastUpdated}>
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </PublicPageLayout>
  );
}

// Metadata for SEO
export async function generateMetadata() {
  const result = await getTermsConditions(true);
  
  return {
    title: result.data?.title || 'Terms and Conditions',
    description: 'Terms and Conditions for EV Charge mobile application',
  };
}
