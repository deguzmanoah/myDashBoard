"use client";

import React, { useState } from 'react';
import { Button } from '@/components';
import { showSuccessToast } from '@/lib/toast';
import { 
  ApiNotification, 
  NotificationFormState 
} from '@/lib/actions/notification-actions';

interface DeactivateNotificationButtonProps {
  notification: ApiNotification;
  onDeactivate: (formData: FormData) => Promise<NotificationFormState>;
}

export default function DeactivateNotificationButton({
  notification,
  onDeactivate
}: DeactivateNotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to archive this notification? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.set('id', notification.id?.toString() || '');
      formData.set('title', notification.title);
      formData.set('message', notification.message);
      formData.set('message_json', JSON.stringify(notification.message_json));
      formData.set('target_audience', notification.target_audience);
      formData.set('type', notification.type);
      formData.set('priority', notification.priority);
      formData.set('status', 'Archived');
      if (notification.send_at) {
        formData.set('send_at', notification.send_at);
      }

      const result = await onDeactivate(formData);
      
      if (result.success) {
        showSuccessToast('Notification marked as Archive successfully!');
      }
    } catch (error) {
      console.error('Error deactivating notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show deactivate button for active notifications (Scheduled or Sent)
  if (notification.status !== 'Scheduled' && notification.status !== 'Sent') {
    return null;
  }

  return (
    <Button
      variant="secondary"
      icon="/icons/icon-archive.svg"
      iconOnly
      onClick={handleDeactivate}
      disabled={isLoading}
      className="shrink-0 border-charge-red"
    />
  );
}
