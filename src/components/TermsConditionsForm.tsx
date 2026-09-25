"use client";

import React, { useState, useEffect, useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, PageHeader, InputField, RichTextEditor, Toggle } from '@/components';
import { 
  updateTermsConditions, 
  type TermsConditionsFormState 
} from '@/lib/actions/terms-conditions-actions';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export interface TermsConditionsFormData {
  id?: string; // Optional since it's handled by the server
  title: string;
  body: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body_json: any;
  is_published: boolean;
}

interface TermsConditionsFormProps {
  initialData: TermsConditionsFormData; // Required - data comes from server
  onCancel?: () => void;
  currentUserId?: string;
}

function SubmitButton({ disabled, formId }: { disabled: boolean; formId?: string }) {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="submit" 
      variant="primary"
      disabled={disabled || pending}
      label={pending ? 'Saving...' : 'Save'}
      form={formId}
    />
  );
}

export default function TermsConditionsForm({
  initialData,
  onCancel,
  currentUserId
}: TermsConditionsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<TermsConditionsFormData>(initialData);

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use server action with useActionState - always updating existing data
  const [formState, formAction] = useActionState<TermsConditionsFormState, FormData>(
    updateTermsConditions,
    { success: false, errors: {} }
  );

  // Sync form data when initialData changes (handles hydration issues)
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Memoized onChange handler for RichTextEditor to prevent focus issues

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBodyChange = useCallback(({ html, editorState }: { html: string; editorState: any }) => {
    setFormData(prev => ({
      ...prev,
      body: html,
      body_json: editorState
    }));

    // Clear client-side validation error when user starts typing
    if (clientErrors.body) {
      setClientErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.body;
        return newErrors;
      });
    }
  }, [clientErrors.body]);

  const handleInputChange = (field: keyof TermsConditionsFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear client-side validation error when user starts typing
    if (clientErrors[field]) {
      setClientErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.body?.trim()) {
      errors.body = 'Body content is required';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!validateForm()) {
      event.preventDefault();
      return;
    }

    setIsSubmitting(true);
    // Form will submit naturally to the action with all form data
  };

  // Handle server response
  useEffect(() => {
    // Reset submitting state when form action completes (success or error)
    if (formState.success || Object.keys(formState.errors).length > 0) {
      setIsSubmitting(false);
    }

    if (formState.success) {
      showSuccessToast('Terms and conditions updated successfully!');
      router.push('/dashboard/app-cms/terms-conditions');
    } else if (formState.errors && Object.keys(formState.errors).length > 0) {
      // Show first error as toast
      const firstError = Object.values(formState.errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        showErrorToast(firstError[0]);
      }
    }
  }, [formState, router]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/dashboard/app-cms/terms-conditions');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Terms and Conditions"
        description="Update terms and conditions content for the mobile application"
      />

      <div className="space-y-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-[964px] mx-auto">
        {/* RichTextEditor - Outside form to avoid conflicts */}
        <RichTextEditor
          label="Body"
          value={formData.body_json}
          onChange={handleBodyChange}
          error={clientErrors.body || formState.errors?.body?.[0]}
          placeholder="Enter the terms and conditions content..."
          minHeight={360}
          autoFocus={false}
          required
        />

        <form
          id="terms-conditions-form"
          action={formAction}
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Hidden fields */}
          <input type="hidden" name="is_published" value={formData.is_published.toString()} />
          <input type="hidden" name="title" value={formData.title} />
          <textarea name="body" value={formData.body} style={{ display: 'none' }} readOnly />
          <input type="hidden" name="body_json" value={JSON.stringify(formData.body_json)} />
          {currentUserId && <input type="hidden" name="updated_by_admin_id" value={currentUserId} />}

          <div className="grid grid-cols-1 gap-6">
            {/* Title Field */}
            <div onFocusCapture={(e) => e.stopPropagation()}>
              <InputField
                label="Title"
                name="title"
                value={formData.title}
                onChange={(value) => handleInputChange('title', value)}
                error={clientErrors.title || formState.errors?.title?.[0]}
                placeholder="Enter terms and conditions title"
                required
              />
            </div>

            {/* Published Toggle */}
            <Toggle
              id="is_published"
              name="is_published"
              label="Publish to App?"
              description="Inactive by Default"
              checked={formData.is_published}
              onChange={(checked) => handleInputChange('is_published', checked)}
              variant="switch"
              size="md"
            />
          </div>
        </form>

        {/* Action Buttons - Outside form but can trigger submission */}
        <div className="flex justify-between space-x-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            label="Cancel"
          />
          <SubmitButton 
            disabled={isSubmitting}
            formId="terms-conditions-form"
          />
        </div>
      </div>
    </div>
  );
}
