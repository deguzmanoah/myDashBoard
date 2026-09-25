"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PricingForm, type PricingFormData } from '@/components';
import { getPricingById } from '@/lib/actions/pricing-actions';
import { useAuth } from '@/hooks/useAuth';

interface PricingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPricingPage({ params }: PricingPageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  // Unwrap the params Promise
  const { id } = use(params);
  const isEditing = id !== 'new';
  const pricingId = isEditing ? id : null;
  
  const [initialData, setInitialData] = useState<Partial<PricingFormData>>({});
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  // Load pricing data for editing
  useEffect(() => {
    if (isEditing && pricingId) {
      const fetchPricingData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const result = await getPricingById(pricingId);
          
          if (result.error) {
            setError(result.error);
          } else if (result.data) {
            setInitialData({
              ...result.data,
              pricing_id: String(result.data.pricing_id || ''),
              cost: String(result.data.cost || ''),
              rate: String(result.data.rate || ''),
              idle: String(result.data.idle || ''),
              admin_fee: String(result.data.admin_fee || ''),
              status: result.data.status as 'Active' | 'Inactive'
            });
          }
        } catch (err) {
          setError('Failed to load pricing data. Please try again.');
          console.error('Error fetching pricing data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchPricingData();
    } else {
      // For new pricing creation
      setInitialData({});
      setLoading(false);
    }
  }, [isEditing, pricingId]);

  const handleCancel = () => {
    // Navigate back to pricing-tariff list page
    router.push('/dashboard/pricing-tariff');
  };

  if (authLoading || loading) {
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <div className="text-red-600">Error: {error}</div>
        <button 
          onClick={() => router.push('/dashboard/pricing-tariff')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Pricing Tariff
        </button>
      </div>
    );
  }

  return (
    <PricingForm
      initialData={initialData}
      isEditing={isEditing}
      onCancel={handleCancel}
      currentUserId={user.id}
    />
  );
}
