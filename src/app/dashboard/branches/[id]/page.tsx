'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BranchForm, type BranchFormData } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { getBranchById } from '@/lib/actions/branch-actions';

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const branchId = params.id as string;
  
  const [initialData, setInitialData] = useState<Partial<BranchFormData> | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        const result = await getBranchById(branchId);
        
        if (result.data) {
          const branch = result.data;
          setInitialData({
            branch_id: branch.branch_id?.toString() || '',
            station_name: branch.station_name,
            city: branch.city,
            region: branch.region,
            zip_code: branch.zip_code,
            address: branch.address,
            latitude: branch.latitude,
            longitude: branch.longitude,
            status: branch.status as 'Active' | 'Inactive' | 'Maintenance',
            description: branch.description,
            description_json: branch.description_json,
            charger_location_image: branch.charger_location || null
          });
        } else {
          console.error('Failed to fetch branch:', result.error);
          router.push('/dashboard/branches');
        }
      } catch (error) {
        console.error('Error fetching branch:', error);
        router.push('/dashboard/branches');
      } finally {
        setLoading(false);
      }
    };

    fetchBranchData();
  }, [branchId, router]);

  if (!user?.id) {
    return null; // or loading state
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index}>
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return null; // This shouldn't happen due to redirect logic above
  }

  return (
    <BranchForm
      initialData={initialData}
      isEditing={true}
      currentUserId={user.id}
    />
  );
}
