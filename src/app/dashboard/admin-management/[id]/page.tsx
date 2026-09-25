"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminForm, type AdminFormData } from '@/components';
import { getAdminById } from '@/lib/actions/admin-actions';
import { useAuth } from '@/hooks/useAuth';

export default function AdminFormPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const isEditing = params.id !== 'new';
  const adminId = isEditing ? params.id as string : null;

  const [initialData, setInitialData] = useState<Partial<AdminFormData>>({});
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  // Load admin data for editing
  useEffect(() => {
    if (isEditing && adminId) {
      const fetchAdminData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const result = await getAdminById(adminId);
          
          if (result.error) {
            setError(result.error);
          } else if (result.data) {
            setInitialData({
              ...result.data,
              user_id: String(result.data.user_id || '')
            });
          }
        } catch (err) {
          setError('Failed to load admin data. Please try again.');
          console.error('Error fetching admin data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchAdminData();
    } else {
      // For new admin creation
      setInitialData({});
      setLoading(false);
    }
  }, [isEditing, adminId]);

  const handleCancel = () => {
    router.push('/dashboard/admin-management');
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
          onClick={() => router.push('/dashboard/admin-management')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Admin Management
        </button>
      </div>
    );
  }

  return (
    <AdminForm
      initialData={initialData}
      isEditing={isEditing}
      onCancel={handleCancel}
      currentUserId={user.id}
    />
  );
}
