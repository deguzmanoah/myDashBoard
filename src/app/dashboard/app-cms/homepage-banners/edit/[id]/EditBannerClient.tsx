'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BannerForm } from '@/components';
import { type ApiBanner } from '@/lib/actions/homepage-banners-actions';

interface EditBannerClientProps {
  banner: ApiBanner;
}

export default function EditBannerClient({ banner }: EditBannerClientProps) {
  const router = useRouter();

  const handleCancel = () => {
    router.push('/dashboard/app-cms/homepage-banners');
  };

  return (
    <BannerForm 
      initialData={banner}
      isEditing={true}
      onCancel={handleCancel}
    />
  );
}
