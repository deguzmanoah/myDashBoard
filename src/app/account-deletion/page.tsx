import PublicPageLayout from '@/components/PublicPageLayout';

export default function AccountDeletionPage() {
  return (
    <PublicPageLayout title=''>
      <div className='text-black pb-4'>
        <h1 className='my-4'>
          Delete your DCharge Account
        </h1>

        <div className='space-y-4'>
          <p>If you want to delete your DCharge account, you may do so using the mobile app or contacting our support team.</p>

          <p>Mobile app: <strong>Go to Profile</strong> &gt; <strong>Tap your email</strong> &gt; <strong>Delete Account</strong></p>

          <p>Support: In the mobile app, go to <strong>Profile</strong> &gt; <strong>Contact Us</strong></p>

          <p>Note: Deleting your account means you will not be able to view your data and you will no longer be able to sign up using the same email for a certain number of days.</p>
        </div>
      </div>
    </PublicPageLayout>
  );
}

// Metadata for SEO
export function generateMetadata() {
  return {
    title: 'Delete your DCharge Account',
    description: 'Instructions for deleting your EV Charge account and associated data.',
  };
}
