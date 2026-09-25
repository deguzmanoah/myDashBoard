'use client';

import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { Button } from '@/components';
import { ApiPricing, PricingFormState } from '@/lib/actions/pricing-actions';

interface InactivatePricingButtonProps {
  pricing: ApiPricing;
  onInactivate: (formData: FormData) => Promise<PricingFormState>;
}

export default function InactivatePricingButton({
  pricing,
  onInactivate,
}: InactivatePricingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isConfirmed = window.confirm(
      `Are you sure you want to make the pricing "${pricing.name}" inactive?`
    );
    
    if (isConfirmed) {
      setIsLoading(true);
      
      try {
        const formData = new FormData();
        formData.set('pricing_id', pricing.pricing_id?.toString() || '');
        formData.set('name', pricing.name);
        formData.set('cost', pricing.cost.toString());
        formData.set('rate', pricing.rate.toString());
        formData.set('idle', pricing.idle.toString());
        formData.set('adminFee', pricing.admin_fee.toString());
        formData.set('status', 'Inactive');
        
        const result = await onInactivate(formData);
        
        if (result?.errors?._form) {
          showErrorToast(result.errors._form[0]);

        } else if (result?.errors) {
          // Handle other validation errors
          const errorMessages = Object.values(result.errors).flat();
          showErrorToast(errorMessages[0] || 'An error occurred');

        } else if (result?.success) {
          // Success case - show success toast and refresh
          showSuccessToast(`Pricing "${pricing.name}" has been made inactive`);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('Error making pricing inactive:', error);
        showErrorToast('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isDisabled = pricing.status.toLowerCase() === 'inactive' || isLoading;

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
