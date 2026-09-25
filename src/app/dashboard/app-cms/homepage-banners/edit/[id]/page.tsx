import React from 'react';
import { notFound } from 'next/navigation';
import { getBannerById } from '@/lib/actions/homepage-banners-actions';
import EditBannerClient from './EditBannerClient';

interface EditBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBannerPage({ params }: EditBannerPageProps) {
  const { id } = await params;
  const bannerId = parseInt(id);

  if (isNaN(bannerId)) {
    notFound();
  }

  try {
    const banner = await getBannerById(bannerId);
    
    if (!banner) {
      notFound();
    }

    return <EditBannerClient banner={banner} />;
  } catch (error) {
    console.error('Failed to fetch banner:', error);
    notFound();
  }
}
