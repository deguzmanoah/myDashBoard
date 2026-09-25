"use client";

import React, { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, SelectField } from '@/components';
import { 
  updateCustomerStatus, 
  type CustomerStatusFormState,
  type ApiCustomer 
} from '@/lib/actions/user-activity-actions';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export interface CustomerStatusFormProps {
  customer: ApiCustomer;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      label={pending ? 'Updating...' : 'Update Status'}
      variant="primary"
      disabled={pending || disabled}
      type="submit"
      className="w-full sm:w-auto"
    />
  );
}

export const CustomerStatusForm: React.FC<CustomerStatusFormProps> = ({
  customer,
}) => {
  const router = useRouter();
  const [formState, formAction] = useActionState<CustomerStatusFormState, FormData>(
    updateCustomerStatus,
    { errors: {}, success: false }
  );

  // Handle success/error states
  React.useEffect(() => {
    if (formState.success) {
      showSuccessToast('Customer status updated successfully!');
      // Refresh the page to show updated data
      router.refresh();
    } else if (formState.errors?._form) {
      showErrorToast(formState.errors._form[0] || 'Failed to update status');
    }
  }, [formState, router]);

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
  ];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="user_id" value={customer.user_id} />
      
      <div className="grid grid-cols-1 gap-6">
        <SelectField
          id="status"
          name="status"
          label="Customer Status"
          value={customer.status}
          options={statusOptions}
          error={formState.errors?.status?.[0]}
          required
        />
      </div>

      {formState.errors?._form && (
        <div className="text-red-600 text-sm">
          {formState.errors._form[0]}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <SubmitButton disabled={false} />
      </div>
    </form>
  );
};
