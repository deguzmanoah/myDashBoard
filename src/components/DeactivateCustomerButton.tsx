'use client';

import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { Button } from '@/components';
import { ApiCustomer, CustomerStatusFormState } from '@/lib/actions/user-activity-actions';

interface DeactivateCustomerButtonProps {
  customer: ApiCustomer;
  onDeactivate: (formData: FormData) => Promise<CustomerStatusFormState>;
}

export default function DeactivateCustomerButton({
  customer,
  onDeactivate,
}: DeactivateCustomerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const isConfirmed = window.confirm(
      `Are you sure you want to deactivate the customer "${customer.customer_name}"?`
    );
    
    if (isConfirmed) {
      setIsLoading(true);
      
      try {
        const formData = new FormData();
        formData.set('user_id', customer.user_id?.toString() || '');
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
          showSuccessToast(`Customer "${customer.customer_name}" has been deactivated`);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('Error deactivating customer:', error);
        showErrorToast('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isDisabled = customer.status.toLowerCase() === 'inactive' || isLoading;

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
