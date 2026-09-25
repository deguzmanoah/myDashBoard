"use client";

import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, PageHeader, InputField, SelectField, RichTextEditor } from '@/components';
import { 
  createNotification, 
  updateNotification, 
  type NotificationFormState 
} from '@/lib/actions/notification-actions';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export interface NotificationFormData {
  id: string;
  title: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message_json: any;
  target_audience: string;
  category: string;
  type: 'Update' | 'Reminder' | 'Maintenance';
  priority: 'Low' | 'Medium' | 'High';
  scheduled_date_time: string;
  send_now: boolean;
  status?: string;
}

interface NotificationFormProps {
  initialData?: Partial<NotificationFormData>;
  isEditing?: boolean;
  isDuplicating?: boolean;
  onCancel: () => void;
  currentUserId: string;
}

const defaultFormData: NotificationFormData = {
  id: '',
  title: '',
  message: '',
  message_json: '',
  target_audience: 'All Users',
  category: 'both',
  type: 'Update',
  priority: 'Medium',
  scheduled_date_time: '',
  send_now: false,
  status: ''
};

function SubmitButton({ isEditing, isDuplicating, disabled, formId }: { isEditing: boolean; isDuplicating: boolean; disabled: boolean; formId?: string }) {
  const { pending } = useFormStatus();
  
  const getButtonLabel = () => {
    if (disabled) return 'Read Only';
    if (pending) {
      if (isDuplicating) return 'Creating...';
      if (isEditing) return 'Saving...';
      return 'Creating...';
    }
    if (isDuplicating) return 'Create Notification';
    if (isEditing) return 'Update Notification';
    return 'Save Notification';
  };
  
  return (
    <Button
      label={getButtonLabel()}
      variant="primary"
      disabled={pending || disabled}
      type="submit"
      form={formId}
    />
  );
}

export default function NotificationForm({
  initialData,
  isEditing = false,
  isDuplicating = false,
  onCancel,
  currentUserId
}: NotificationFormProps) {

  const router = useRouter();
  const [formData, setFormData] = useState<NotificationFormData>(defaultFormData);

  const [clientErrors, setClientErrors] = useState({
    title: '',
    message: '',
    message_json: '',
    target_audience: '',
    category: '',
    type: '',
    priority: '',
    scheduled_date_time: ''
  });

  // Form state for server action
  const initialState: NotificationFormState = {};
  const [formState, formAction] = useActionState(
    isEditing ? updateNotification : createNotification, 
    initialState
  );

  // Check if form should be readonly based on status
  const isReadonly = formData.status === 'Sent' || formData.status === 'Archived';

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Ensure message is properly set from initialData
        message: initialData.message || prev.message,
        message_json: initialData.message_json || prev.message_json,
        scheduled_date_time: initialData.scheduled_date_time || prev.scheduled_date_time
      }));
    }
  }, [initialData]);

  // Show error toast when form errors occur
  useEffect(() => {
    if (formState?.errors?._form) {
      showErrorToast(formState.errors._form[0]);
    }
  }, [formState?.errors?._form]);

  // Show success toast and redirect on successful submission
  useEffect(() => {
    if (formState?.success) {
      const getSuccessMessage = () => {
        if (isDuplicating) return 'Notification created successfully!';
        if (isEditing) return 'Notification updated successfully!';
        return 'Notification created successfully!';
      };
      
      showSuccessToast(getSuccessMessage());
      router.push('/dashboard/notifications');
    }
  }, [formState?.success, isEditing, isDuplicating, router]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRichTextChange = ({ html, editorState }: { html: string; editorState: any }) => {
    setFormData(prev => ({
      ...prev,
      message: html,
      message_json: editorState
    }));
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'send_now' ? value === 'true' : value
    }));

    // Clear client-side validation error when user starts typing
    if (clientErrors[name as keyof typeof clientErrors]) {
      setClientErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Set current datetime when send_now is enabled
    if (name === 'send_now' && value === 'true') {
      const now = new Date();
      const currentDateTime = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
      
      setFormData(prev => ({
        ...prev,
        send_now: true,
        scheduled_date_time: currentDateTime
      }));
    } else if (name === 'send_now' && value === 'false') {
      // Clear scheduled_date_time when send_now is disabled
      setFormData(prev => ({
        ...prev,
        send_now: false,
        scheduled_date_time: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {
      title: '',
      message: '',
      message_json: '',
      target_audience: '',
      category: '',
      type: '',
      priority: '',
      scheduled_date_time: ''
    };

    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    } else if (formData.category === 'in-app' && formData.title.length > 30) {
      errors.title = 'Title cannot exceed 30 characters for In-App notifications';
      isValid = false;
    }

    const plainMessage = formData.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/gi, ' ').trim();
    if (!plainMessage) {
      errors.message = 'Message is required';
      isValid = false;
    } else if (formData.category === 'in-app' && plainMessage.length > 150) {
      errors.message = 'Message cannot exceed 150 characters for In-App notifications';
      isValid = false;
    }

    if (!formData.target_audience.trim()) {
      errors.target_audience = 'Target audience is required';
      isValid = false;
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
      isValid = false;
    }

    // Validate scheduled date time if send_now is false
    if (!formData.send_now) {
      if (!formData.scheduled_date_time.trim()) {
        errors.scheduled_date_time = 'Schedule date & time is required';
        isValid = false;
      } else {
        // Check if the selected date is in the past
        const selectedDate = new Date(formData.scheduled_date_time);
        const now = new Date();
        
        if (selectedDate <= now) {
          errors.scheduled_date_time = 'Schedule date & time must be in the future';
          isValid = false;
        }
      }
    }

    setClientErrors(errors);
    return isValid;
  };

  const handleSubmit = async (formData: FormData) => {
    if (!validateForm()) {
      return;
    }

    // Add current user ID to form data
    formData.set('admin_id', currentUserId);
    
    // Only include ID for editing, not for creating or duplicating
    if (isEditing && !isDuplicating && formData.get('id')) {
      formData.set('id', formData.get('id') as string);
    }

    await formAction(formData);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          isDuplicating 
            ? 'Create New Notification' 
            : isEditing 
              ? (isReadonly ? 'View Notification' : 'Edit Notification')
              : 'Add New Notification'
        }
        description={
          isDuplicating
            ? 'Create a new notification based on the selected notification.'
            : isEditing 
              ? (isReadonly ? 'This notification cannot be edited because it has been sent or archived.' : 'Update the notification details below.')
              : 'Create a new notification to send to users.'
        }
      />

      {/* Readonly notification banner */}
      {isReadonly && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Read-only Mode
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This notification is in read-only mode because its status is &ldquo;{formData.status}&rdquo;. 
                  {formData.status === 'Sent' && ' Sent notifications cannot be modified.'}
                  {formData.status === 'Archived' && ' Archived notifications cannot be modified.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <form id="notification-form" action={handleSubmit} className="space-y-6">
          {/* Hidden field for notification ID when editing (not duplicating) */}
          {isEditing && !isDuplicating && (
            <input type="hidden" name="id" value={formData.id} />
          )}

          {/* Hidden field for send_now boolean value */}
          <input type="hidden" name="send_now" value={formData.send_now.toString()} />

          {/* Hidden field for message content */}
          <input type="hidden" name="message" value={formData.message} />
          <input type="hidden" name="message_json" value={JSON.stringify(formData.message_json)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputField
                label="Title"
                name="title"
                value={formData.title}
                onChange={(value) => handleInputChange('title', value)}
                error={clientErrors.title || formState?.errors?.title?.[0]}
                placeholder="Enter notification title"
                required
                disabled={isReadonly}
                maxLength={formData.category === 'in-app' ? 30 : undefined}
              />
            </div>

            <SelectField
              label="Notification Type"
              name="type"
              value={formData.type}
              onChange={(value) => handleInputChange('type', value)}
              error={clientErrors.type || formState?.errors?.type?.[0]}
              options={[
                { value: 'Update', label: 'Update' },
                { value: 'Reminder', label: 'Reminder' },
                { value: 'Maintenance', label: 'Maintenance' }
              ]}
              required
              disabled={isReadonly}
            />

            <SelectField
              label="Priority Level"
              name="priority"
              value={formData.priority}
              onChange={(value) => handleInputChange('priority', value)}
              error={clientErrors.priority || formState?.errors?.priority?.[0]}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' }
              ]}
              required
              disabled={isReadonly}
            />

            <SelectField
              label="Target Audience"
              name="target_audience"
              value={formData.target_audience}
              onChange={(value) => handleInputChange('target_audience', value)}
              error={clientErrors.target_audience || formState?.errors?.target_audience?.[0]}
              options={[
                { value: 'All Users', label: 'All Users' }
              ]}
              required
              disabled={isReadonly}
            />

            <SelectField
              label="Category"
              name="category"
              value={formData.category}
              onChange={(value) => handleInputChange('category', value)}
              error={clientErrors.category || formState?.errors?.category?.[0]}
              options={[
                { value: 'email', label: 'Email' },
                { value: 'in-app', label: 'In-App' },
              ]}
              required
              disabled={isReadonly}
            />

            <InputField
              label="Schedule Date & Time"
              name="send_at"
              type="datetime-local"
              value={formData.scheduled_date_time}
              onChange={(value) => handleInputChange('scheduled_date_time', value)}
              error={clientErrors.scheduled_date_time || formState?.errors?.send_at?.[0]}
              placeholder="Select when to send the notification"
              disabled={formData.send_now || isReadonly}
              min={new Date().toISOString().slice(0, 16)}
            />

            <div className="flex flex-col pt-7">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="send_now"
                  name="send_now"
                  checked={formData.send_now}
                  onChange={(e) => handleInputChange('send_now', e.target.checked.toString())}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  disabled={isReadonly}
                />
                <label htmlFor="send_now" className="text-sm font-medium text-gray-700">
                  Send Now
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Check this to send the notification immediately instead of scheduling it
              </p>
            </div>
          </div>
        </form>

        {/* RichTextEditor - Outside form to avoid conflicts */}
        <div className="mt-6">
          {isReadonly ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Message
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="border rounded-md border-gray-300 bg-gray-50 p-3 min-h-[120px]">
                <div 
                  className="text-sm text-gray-500"
                  dangerouslySetInnerHTML={{ __html: formData.message || 'No message content' }}
                />
              </div>
            </div>
          ) : (
            <RichTextEditor
              key={`message-${formData.id || 'new'}`}
              label="Message"
              value={formData.message}
              onChange={(value) => handleRichTextChange(value)}
              error={clientErrors.message || formState?.errors?.message?.[0]}
              placeholder="Enter notification message"
              autoFocus={false}
              required
              maxLength={formData.category === 'in-app' ? 150 : undefined}
            />
          )}
        </div>

        {/* Action Buttons - Outside form but can trigger submission */}
        <div className="flex justify-between space-x-4 pt-6 border-t border-gray-200 mt-6">
          <Button
            label="Cancel"
            variant="secondary"
            onClick={onCancel}
            type="button"
          />
          <SubmitButton 
            isEditing={isEditing} 
            isDuplicating={isDuplicating}
            disabled={isReadonly}
            formId="notification-form"
          />
        </div>
      </div>
    </div>
  );
}
