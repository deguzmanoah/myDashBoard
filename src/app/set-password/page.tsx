import React, { Suspense } from 'react';
import { createPageMetadata } from '@/lib/metadata';
import SetPasswordForm from './SetPasswordForm';

export const metadata = createPageMetadata('Set Password', 'Set your password for the Charge admin dashboard');

function SetPasswordFormFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Set Password</h2>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<SetPasswordFormFallback />}>
      <SetPasswordForm />
    </Suspense>
  );
}
