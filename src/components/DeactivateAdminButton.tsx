'use client';

import React, { useState } from 'react';
import { Button } from '@/components';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { AdminFormState } from '@/lib/actions/admin-actions';

interface DeactivateAdminButtonProps {
  adminName: string;
  userId: number;
  currentUserId: string;
  adminStatus: string;
  onDeactivate: (formData: FormData) => Promise<AdminFormState>;
}

export default function DeactivateAdminButton({
  adminName,
  userId,
  currentUserId,
  adminStatus,
  onDeactivate,
}: DeactivateAdminButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const isConfirmed = window.confirm(
      `Are you sure you want to deactivate ${adminName}?`
    );
    
    if (isConfirmed) {
      setIsLoading(true);
      
      try {
        const formData = new FormData();
        formData.set('user_id', userId.toString());
        formData.set('status', 'Deactivated');
        
        const result = await onDeactivate(formData);
        
        if (result?.errors?._form) {
          showErrorToast(result.errors._form[0]);
        } else if (result?.errors) {
          const errorMessages = Object.values(result.errors).flat();
          showErrorToast(errorMessages[0] || 'An error occurred');
        } else {
          showSuccessToast(`${adminName} has been deactivated successfully`);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.error('Error deactivating admin:', error);
        showErrorToast('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isDisabled = 
    adminStatus.toLowerCase() === 'deactivated' || 
    userId.toString() === currentUserId ||
    isLoading;

  return (
    <form onSubmit={handleSubmit} className="inline">
      <Button
        variant="secondary" 
        icon="/icons/icon-delete.svg"
        iconOnly
        className="shrink-0 border-charge-red"
        type="submit"
        disabled={isDisabled}
      />
    </form>
  );
}
