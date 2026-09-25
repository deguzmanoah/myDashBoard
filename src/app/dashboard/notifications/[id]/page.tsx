"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationForm, type NotificationFormData } from '@/components';
import { getNotificationById, type ApiNotification } from '@/lib/actions/notification-actions';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    mode?: 'duplicate';
  }>;
}

export default function EditNotificationPage({ params, searchParams }: NotificationPageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  // Unwrap the params and searchParams Promises
  const { id } = use(params);
  const { mode } = use(searchParams);
  const isDuplicating = mode === 'duplicate';
  const isEditing = id !== 'new' && !isDuplicating;
  const notificationId = (isEditing || isDuplicating) ? id : null;
  
  const [initialData, setInitialData] = useState<Partial<NotificationFormData>>({});
  const [loading, setLoading] = useState(isEditing || isDuplicating);
  const [error, setError] = useState<string | null>(null);

  // Load notification data for editing or duplicating
  useEffect(() => {
    if ((isEditing || isDuplicating) && notificationId) {
      const fetchNotificationData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const result = await getNotificationById(notificationId);
          
          if (result.error) {
            setError(result.error);
          } else if (result.data) {
            const data = result.data as ApiNotification;
            const formattedData: Partial<NotificationFormData> = {
              ...data,
              id: String(data.id || ''),
              status: data.status, // Include status for readonly logic
              scheduled_date_time: data.send_at 
                ? new Date(data.send_at).toISOString().slice(0, 16) 
                : '',
              type: data.type as NotificationFormData['type'],
              priority: data.priority as NotificationFormData['priority'],
              send_now: false
            };
            
            // For duplication, clear the ID and modify the title to indicate it's a copy
            if (isDuplicating) {
              formattedData.id = '';
              formattedData.title = `Copy of ${formattedData.title}`;
              formattedData.send_now = false;
              formattedData.scheduled_date_time = '';
            }
            
            setInitialData(formattedData);
          }
        } catch (err) {
          console.error('Error fetching notification:', err);
          setError('Failed to load notification data');
        } finally {
          setLoading(false);
        }
      };

      fetchNotificationData();
    }
  }, [isEditing, isDuplicating, notificationId]);

  const handleCancel = () => {
    router.push('/dashboard/notifications');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-600">Error: {error}</div>
        <div className="space-x-2">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
          <button 
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <NotificationForm
      initialData={initialData}
      isEditing={isEditing}
      isDuplicating={isDuplicating}
      onCancel={handleCancel}
      currentUserId={user.id}
    />
  );
}
