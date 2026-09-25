'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BannerForm } from '@/components';

export default function AddBannerPage() {
  const router = useRouter();

  const handleCancel = () => {
    router.push('/dashboard/app-cms/homepage-banners');
  };

  return (
    <BannerForm 
      isEditing={false}
      onCancel={handleCancel}
    />
  );
}
