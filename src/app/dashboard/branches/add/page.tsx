import React from 'react';
import { getUserData } from '@/lib/actions/auth-actions';
import { BranchForm } from '@/components';

export default async function AddBranchPage() {
  const currentUser = await getUserData();

  if (!currentUser?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Access Denied</div>
          <div className="text-gray-600">You need to be logged in to access this page.</div>
        </div>
      </div>
    );
  }

  return (
    <BranchForm
      isEditing={false}
      currentUserId={currentUser.id}
    />
  );
}
