"use client";

import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, PageHeader, InputField, SelectField } from '@/components';
import { 
  createPricing, 
  updatePricing, 
  type PricingFormState 
} from '@/lib/actions/pricing-actions';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export interface PricingFormData {
  pricing_id: string;
  name: string;
  cost: string;
  rate: string;
  idle: string;
  admin_fee: string;
  status: 'Active' | 'Inactive';
  description: string;
}

interface PricingFormProps {
  initialData?: Partial<PricingFormData>;
  isEditing?: boolean;
  onCancel: () => void;
  currentUserId: string;
}

const defaultFormData: PricingFormData = {
  pricing_id: '',
  name: '',
  cost: '',
  rate: '',
  idle: '',
  admin_fee: '',
  status: 'Active',
  description: ''
};

function SubmitButton({ isEditing, disabled }: { isEditing: boolean; disabled: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      label={
        pending 
          ? (isEditing ? 'Saving...' : 'Creating...') 
          : (isEditing ? 'Update Pricing' : 'Save Pricing')
      }
      variant="primary"
      disabled={pending || disabled}
      type="submit"
    />
  );
}

export default function PricingForm({
  initialData,
  isEditing = false,
  onCancel,
  currentUserId
}: PricingFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<PricingFormData>(defaultFormData);

  const [clientErrors, setClientErrors] = useState({
    name: '',
    cost: '',
    rate: '',
    idle: '',
    admin_fee: ''
  });

  // Form state for server action
  const initialState: PricingFormState = {};
  const [formState, formAction] = useActionState(
    isEditing ? updatePricing : createPricing, 
    initialState
  );

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  // Show error toast when form errors occur
  useEffect(() => {
    if (formState?.errors?._form) {
      showErrorToast(formState.errors._form[0]);
    }
  }, [formState?.errors?._form]);

  // Handle successful form submission
  useEffect(() => {
    if (formState?.success) {
      const successMessage = isEditing 
        ? 'Pricing updated successfully!' 
        : 'Pricing created successfully!';
      showSuccessToast(successMessage);
      
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        router.push('/dashboard/pricing-tariff');
      }, 1000);
    }
  }, [formState?.success, isEditing, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear client error when user starts typing and perform real-time validation
    if (field === 'name') {
      setClientErrors(prev => ({
        ...prev,
        name: value.trim() ? '' : 'Pricing name is required'
      }));
    } else if (['cost', 'rate', 'idle', 'admin_fee'].includes(field)) {
      let error = '';
      if (!value.trim()) {
        error = `${field.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())} is required`;
      } else if (isNaN(Number(value)) || Number(value) < 0) {
        error = 'Please enter a valid positive number';
      }
      setClientErrors(prev => ({
        ...prev,
        [field]: error
      }));
    } else {
      // Clear any existing error for other fields
      if (clientErrors[field as keyof typeof clientErrors]) {
        setClientErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Pricing' : 'Add Pricing'}
        onBackClick={onCancel}
      />

      {/* Form */}
      <form action={formAction} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-[946px] mx-auto">
        <div className="space-y-5">
          {/* Hidden fields for server action */}
          <input 
            type="hidden"
            name="admin_id"
            value={currentUserId}
          />
          
          {/* Server-side form errors */}
          {formState.errors?._form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{formState.errors._form[0]}</p>
            </div>
          )}

        <div className='font-bold text-sm'>
          General Info
        </div>

        {/* Row 1: Pricing ID & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Pricing ID"
            name="pricing_id"
            value={formData.pricing_id}
            readOnly
            placeholder={isEditing ? formData.pricing_id : "Auto-generated by system"}
            onChange={(value) => handleInputChange('pricing_id', value)}
          />

          <SelectField
            label="Status"
            name="status"
            value={formData.status}
            onChange={(value) => handleInputChange('status', value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
          />
        </div>

        <InputField
          label="Pricing Name"
          name="name"
          value={formData.name}
          onChange={(value) => handleInputChange('name', value)}
          placeholder="Enter pricing name"
          required
          error={clientErrors.name || formState.errors?.name?.[0]}
        />

        <div className='font-bold text-sm'>
          Pricing Properties
        </div>

        {/* Row 2: Cost per kWh & Rate per Min */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Cost per kWh (₱)"
            name="cost"
            type="number"
            value={formData.cost}
            onChange={(value) => handleInputChange('cost', value)}
            placeholder="0.00"
            required
            error={clientErrors.cost || formState.errors?.cost?.[0]}
          />

          <InputField
            label="Rate per Min (₱)"
            name="rate"
            type="number"
            value={formData.rate}
            onChange={(value) => handleInputChange('rate', value)}
            placeholder="0.00"
            required
            error={clientErrors.rate || formState.errors?.rate?.[0]}
          />
        </div>

        {/* Row 3: Idle Fee & Admin Fee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Idle Fee (₱/min)"
            name="idle"
            type="number"
            value={formData.idle}
            onChange={(value) => handleInputChange('idle', value)}
            placeholder="0.00"
            required
            error={clientErrors.idle || formState.errors?.idle?.[0]}
          />

          <InputField
            label="Admin Fee (₱/min)"
            name="admin_fee"
            type="number"
            value={formData.admin_fee}
            onChange={(value) => handleInputChange('admin_fee', value)}
            placeholder="0.00"
            required
            error={clientErrors.admin_fee || formState.errors?.admin_fee?.[0]}
          />
        </div>

        {/* Row 5: Description */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            style={{ borderColor: '#D9D9D9' }}
            placeholder="Optional description for this pricing..."
          />
        </div> */}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            label="Cancel"
            variant="secondary"
            onClick={onCancel}
            type="button"
          />
          <SubmitButton 
            isEditing={isEditing}
            disabled={
              !!clientErrors.name || 
              !!clientErrors.cost ||
              !!clientErrors.rate ||
              !!clientErrors.idle ||
              !!clientErrors.admin_fee ||
              !formData.name ||
              !formData.cost ||
              !formData.rate ||
              !formData.idle ||
              !formData.admin_fee
            }
          />
        </div>
        </div>
      </form>
    </div>
  );
}
