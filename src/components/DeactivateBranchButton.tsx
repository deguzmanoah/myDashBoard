'use client';

import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { Button } from '@/components';
import { ApiBranch, BranchFormState } from '@/lib/actions/branch-actions';

interface DeactivateBranchButtonProps {
  branch: ApiBranch;
  onDeactivate: (formData: FormData) => Promise<BranchFormState>;
}

export default function DeactivateBranchButton({
  branch,
  onDeactivate,
}: DeactivateBranchButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isConfirmed = window.confirm(
      `Are you sure you want to deactivate the branch "${branch.station_name}"?`
    );
    
    if (isConfirmed) {
      setIsLoading(true);
      
      try {
        const formData = new FormData();
        formData.set('branch_id', branch.branch_id?.toString() || '');
        formData.set('station_name', branch.station_name);
        formData.set('city', branch.city);
        formData.set('region', branch.region);
        formData.set('zip_code', branch.zip_code);
        formData.set('address', branch.address);
        formData.set('latitude', branch.latitude?.toString() || '');
        formData.set('longitude', branch.longitude?.toString() || '');
        formData.set('description', branch.description || '');
        formData.set('status', 'Inactive');
        
        const result = await onDeactivate(formData);
        
        if (result?.errors?._form) {
          showErrorToast(result.errors._form[0]);

        } else if (result?.errors) {
          // Handle other validation errors
          const errorMessages = Object.values(result.errors).flat();
          showErrorToast(errorMessages[0] || 'An error occurred');

        } else if (result?.success) {
          // Success case - show success toast and refresh
          showSuccessToast(`Branch "${branch.station_name}" has been deactivated`);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('Error deactivating branch:', error);
        showErrorToast('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isDisabled = branch.status.toLowerCase() === 'inactive' || isLoading;

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
