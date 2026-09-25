'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ApiBanner, updateBannerStatus } from '@/lib/actions/homepage-banners-actions';
import Button from './Button';

interface BannerCardProps {
  banner: ApiBanner;
}

export default function BannerCard({ banner }: BannerCardProps) {
  const handleToggleStatus = async () => {
    try {
      await updateBannerStatus(banner.id, !banner.is_published);
    } catch (error) {
      console.error('Failed to update banner status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Banner Image */}
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        <Image
          src={banner.image}
          alt={banner.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              banner.is_published
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {banner.is_published ? 'Published' : 'Draft'}
          </span>
        </div>
        {/* Order Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Order: {banner.order}
          </span>
        </div>
      </div>

      {/* Banner Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 overflow-hidden" style={{ 
          display: '-webkit-box', 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: 'vertical' 
        }}>
          {banner.title}
        </h3>
        
        <div className="text-sm text-gray-600 mb-3">
          <p className="mb-1">
            <span className="font-medium">URL:</span>{' '}
            <span className="text-blue-600 truncate">{banner.url}</span>
          </p>
          <p className="mb-1">
            <span className="font-medium">Created:</span> {formatDate(banner.created_at)}
          </p>
          <p>
            <span className="font-medium">Updated:</span> {formatDate(banner.updated_at)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex space-x-2">
            {/* <Button
              label={banner.is_published ? 'Unpublish' : 'Publish'}
              variant="secondary"
              onClick={handleToggleStatus}
              className="!text-sm !py-2 !px-4"
            /> */}
          </div>
          
          <div className="flex space-x-1">
            <Link href={`/dashboard/app-cms/homepage-banners/edit/${banner.id}`}>
              <Button
                icon="/icons/icon-pencil.svg"
                iconWidth={20}
                iconHeight={20}
                variant="secondary"
                iconOnly
                className="!p-2"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
