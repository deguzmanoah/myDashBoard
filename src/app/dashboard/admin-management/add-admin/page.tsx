"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminForm } from '@/components';
import { useAuth } from '@/hooks/useAuth';

export default function AddAdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const handleCancel = () => {
    router.push('/dashboard/admin-management');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <div className="text-red-600">Error: User not authenticated</div>
        <button 
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <AdminForm
      initialData={{ status: 'Pending' }}
      isEditing={false}
      onCancel={handleCancel}
      currentUserId={user.id}
    />
  );
}
