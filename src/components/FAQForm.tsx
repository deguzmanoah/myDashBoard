"use client";

import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, PageHeader, InputField, SelectField, RichTextEditor } from '@/components';
import { createFAQ, updateFAQ, FAQFormState } from '@/lib/actions/faq-actions';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export interface FAQFormData {
  id: string;
  question: string;
  answer: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answer_json: any;
  category: string;
  status: 'Active' | 'Inactive';
  order: string;
}

interface FAQFormProps {
  initialData?: Partial<FAQFormData>;
  isEditing?: boolean;
  onCancel: () => void;
  currentUserId: string;
}

const defaultFormData: FAQFormData = {
  id: '',
  question: '',
  answer: '',
  answer_json: '',
  category: 'Charging',
  status: 'Active',
  order: '1'
};

function SubmitButton({ formId }: { formId?: string }) {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="submit" 
      variant="primary"
      disabled={pending}
      label={pending ? "Saving..." : "Save"}
      form={formId}
    />
  );
}

export default function FAQForm({ 
  initialData, 
  isEditing = false, 
  onCancel,
  currentUserId
}: FAQFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FAQFormData>(defaultFormData);

  // Use server actions with form state
  const [state, formAction] = useActionState(
    isEditing ? updateFAQ : createFAQ,
    { errors: {}, success: false } as FAQFormState
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Ensure answer is properly set from initialData
        answer: initialData.answer || prev.answer,
        answer_json: initialData.answer_json || prev.answer_json,
      }));
    }
  }, [initialData]);

  // Show error toast when form errors occur
  useEffect(() => {
    if (state.errors?._form) {
      showErrorToast(state.errors._form[0]);
    }
  }, [state.errors?._form]);

  // Show success toast and redirect on successful submission
  useEffect(() => {
    if (state.success) {
      const getSuccessMessage = () => {
        if (isEditing) return 'FAQ updated successfully!';
        return 'FAQ created successfully!';
      };
      
      showSuccessToast(getSuccessMessage());
      router.push('/dashboard/app-cms/faqs');
    }
  }, [state.success, isEditing, router]);

  const categoryOptions = [
    { value: 'Charging', label: 'Charging' },
    { value: 'Payments', label: 'Payments' },
    { value: 'Navigation', label: 'Navigation' },
    { value: 'Support', label: 'Support' },
    { value: 'Fees & Charges', label: 'Fees & Charges' },
    { value: 'General', label: 'General' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRichTextChange = ({ html, editorState }: { html: string; editorState: any }) => {
    setFormData(prev => ({
      ...prev,
      answer: html,
      answer_json: editorState
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: keyof FAQFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Merge server errors with client errors
  const displayErrors = {
    ...errors,
    ...(state.errors?.question && { question: state.errors.question[0] }),
    ...(state.errors?.answer && { answer: state.errors.answer[0] }),
    ...(state.errors?.answer_json && { answer_json: state.errors.answer_json[0] }),
    ...(state.errors?.category && { category: state.errors.category[0] }),
    ...(state.errors?.order && { order: state.errors.order[0] }),
  };

  const getPageTitle = () => {
    if (isEditing) return 'Edit FAQ';
    return 'Compose FAQ';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={getPageTitle()}
        onBackClick={() => onCancel()}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-[964px] mx-auto space-y-6">
        <form
          id="faq-form"
          action={formAction}
        >
          {/* Hidden fields for server action */}
          <input type="hidden" name="admin_id" value={currentUserId} />
          <input type="hidden" name="id" value={formData.id} />
          <input type="hidden" name="question" value={formData.question} />
          <input type="hidden" name="answer" value={JSON.stringify(formData.answer)} />
          <input type="hidden" name="answer_json" value={JSON.stringify(formData.answer_json)} />
          <input type="hidden" name="category" value={formData.category} />
          <input type="hidden" name="status" value={formData.status} />
          <input type="hidden" name="order" value={formData.order} />
          
          {/* Display server form errors */}
          {state.errors?._form && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800 text-sm">
                {state.errors._form.map((error: string, index: number) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-6">
            <InputField
              label="ID"
              value={formData.id}
              onChange={(value) => handleInputChange('id', value)}
              placeholder="Auto-generated ID"
              readOnly
            />

            <InputField
              label="Question"
              value={formData.question}
              onChange={(value) => handleInputChange('question', value)}
              error={displayErrors.question}
              placeholder="Enter the frequently asked question"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SelectField
                label="Category"
                value={formData.category}
                onChange={(value) => handleInputChange('category', value)}
                options={categoryOptions}
                error={displayErrors.category}
                required
              />

              <SelectField
                label="Status"
                value={formData.status}
                onChange={(value) => handleInputChange('status', value)}
                options={statusOptions}
                required
              />

              <InputField
                label="Order"
                value={formData.order}
                onChange={(value) => handleInputChange('order', value)}
                placeholder="Enter display order (e.g., 1, 2, 3...)"
                type="number"
                min="1"
                required
              />
            </div>
          </div>
        </form>

        {/* RichTextEditor - Outside form to avoid conflicts */}
        <RichTextEditor
          key={`answer-${formData.id || 'new'}`}
          label="Answer"
          value={formData.answer_json}
          error={displayErrors.answer || displayErrors.answer_json}
          placeholder="Provide a detailed answer to the question"
          required
          autoFocus={false}
          onChange={(value) => handleRichTextChange(value)}
        />

        {/* Action Buttons - Outside form but can trigger submission */}
        <div className="flex gap-3 pt-4 justify-between border-t border-gray-200">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            label="Cancel"
          />

          <SubmitButton formId="faq-form" />
        </div>
      </div>
    </div>
  );
}
