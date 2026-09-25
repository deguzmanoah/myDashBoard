import { getPrivacyPolicy } from '@/lib/actions/privacy-policy-actions';
import { notFound } from 'next/navigation';
import PublicPageLayout from '@/components/PublicPageLayout';

// Force dynamic rendering to ensure fresh content from CMS
export const dynamic = 'force-dynamic';

export default async function PublicPrivacyPolicyPage() {
  // Fetch published privacy policy data using public API
  const result = await getPrivacyPolicy(true);

  // Handle error or unpublished case
  if (!result.success || !result.data) {
    // For development/demo purposes, show a placeholder if no published content
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      return (
        <PublicPageLayout title="Privacy Policy" lastUpdated="Demo Content">
          <div className="text-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Demo Content</h3>
            <p className="text-yellow-700 mb-4">
              No published privacy policy found. This is demo content for development.
            </p>
            <p className="text-sm text-yellow-600">
              To see real content: Go to Dashboard → App CMS → Privacy Policy, add content, and mark it as &quot;Published&quot;
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
  const result = await getPrivacyPolicy(true);
  
  return {
    title: result.data?.title || 'Privacy Policy',
    description: 'Privacy Policy for EV Charge mobile application',
  };
}
