import { TermsConditionsForm } from '@/components';
import { getTermsConditions } from '@/lib/actions/terms-conditions-actions';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function TermsConditionsPage() {
  // Get current user ID from userData cookie
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get('userData')?.value;
  
  if (!userDataCookie) {
    redirect('/login');
  }

  let currentUserId: string;
  try {
    const userData = JSON.parse(userDataCookie);
    currentUserId = userData.id;
  } catch (error) {
    console.error('Failed to parse user data:', error);
    redirect('/login');
  }

  // Fetch terms conditions data on the server
  const result = await getTermsConditions();

  // Handle error case
  if (!result.success) {
    console.error('Failed to fetch terms and conditions:', result.error);
    // Let the form handle the empty state and show loading/error
  }

  const termsConditionsData = result.data ? {
    id: result.data.id,
    title: result.data.title,
    body: result.data.body,
    body_json: result.data.body_json,
    is_published: result.data.is_published
  } : {
    title: '',
    body: '',
    body_json: {},
    is_published: false
  };

  return (
    <TermsConditionsForm 
      initialData={termsConditionsData} 
      currentUserId={currentUserId}
    />
  );
}
