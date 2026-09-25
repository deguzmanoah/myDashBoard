'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ChargingStationForm from '@/components/ChargingStationForm';
import { useAuth } from '@/hooks/useAuth';

export default function AddStationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleCancel = () => {
    router.push('/dashboard/charging-stations');
  };

  if (!user?.id) {
    return null; // or loading state
  }

  return (
    <ChargingStationForm
      isEditing={false}
      onCancel={handleCancel}
      currentUserId={user.id}
    />
  );
}
