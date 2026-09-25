"use client";

import React, { useState, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, PageHeader, InputField, TextAreaField, SelectField } from '@/components';
import { 
  createAdmin, 
  updateAdmin, 
  resendInvite,
  type AdminFormState 
} from '@/lib/actions/admin-actions';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export interface AdminFormData {
  user_id: string;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  organization: string;
  status: string;
  internal_notes: string;
}

export interface AdminFormProps {
  initialData?: Partial<AdminFormData>;
  isEditing?: boolean;
  onCancel: () => void;
  currentUserId: string;
}

function SubmitButton({ isEditing, disabled }: { isEditing: boolean; disabled: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      label={
        pending 
          ? (isEditing ? 'Saving...' : 'Inviting...') 
          : (isEditing ? 'Save Admin' : 'Invite User')
      }
      variant="primary"
      disabled={pending || disabled}
      type="submit"
    />
  );
}

export const AdminForm: React.FC<AdminFormProps> = ({
  initialData,
  isEditing = false,
  onCancel,
  currentUserId
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<AdminFormData>({
    user_id: '',
    role: '',
    first_name: '',
    last_name: '',
    email: '',
    organization: '',
    status: 'Pending',
    internal_notes: '',
    ...initialData
  });

  const [clientErrors, setClientErrors] = useState({
    role: '',
    email: '',
    first_name: '',
    last_name: '',
    organization: ''
  });

  const [resendInviteLoading, setResendInviteLoading] = useState(false);
  const [resendInviteMessage, setResendInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for server action
  const initialState: AdminFormState = {};
  const [formState, formAction] = useActionState(
    isEditing ? updateAdmin : createAdmin, 
    initialState
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear client error when user starts typing and perform real-time validation
    if (field === 'role') {
      setClientErrors(prev => ({
        ...prev,
        role: value.trim() ? '' : 'Role is required'
      }));
    } else if (field === 'email') {
      let emailError = '';
      if (!value.trim()) {
        emailError = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        emailError = 'Please enter a valid email address';
      }
      setClientErrors(prev => ({
        ...prev,
        email: emailError
      }));
    } else if (field === 'first_name') {
      setClientErrors(prev => ({
        ...prev,
        first_name: value.trim() ? '' : 'First name is required'
      }));
    } else if (field === 'last_name') {
      setClientErrors(prev => ({
        ...prev,
        last_name: value.trim() ? '' : 'Last name is required'
      }));
    } else if (field === 'organization') {
      setClientErrors(prev => ({
        ...prev,
        organization: value.trim() ? '' : 'Organization is required'
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

  const organizationOptions = [
    'Merchant A',
    'Merchant B', 
    'Merchant C'
  ];

  const statusOptions = ['active', 'pending', 'suspended', 'deactivated'];

  const handleResendInvite = async () => {
    if (!formData.email || !formData.user_id) {
      showErrorToast('Missing email or user ID for resending invite.');
      return;
    }

    setResendInviteLoading(true);
    setResendInviteMessage(null);

    try {
      const result = await resendInvite(formData.email, currentUserId);
      
      if (result.success) {
        showSuccessToast('Invite has been resent successfully!');
        setResendInviteMessage({
          type: 'success',
          text: 'Invite has been resent successfully!'
        });
      } else {
        showErrorToast(result.error || 'Failed to resend invite. Please try again.');
        setResendInviteMessage({
          type: 'error',
          text: result.error || 'Failed to resend invite. Please try again.'
        });
      }
    } catch {
      showErrorToast('An unexpected error occurred while resending the invite.');
      setResendInviteMessage({
        type: 'error',
        text: 'An unexpected error occurred while resending the invite.'
      });
    } finally {
      setResendInviteLoading(false);
    }
  };

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
        ? 'Admin updated successfully!' 
        : 'Admin invited successfully!';
      showSuccessToast(successMessage);
      
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        router.push('/dashboard/admin-management');
      }, 1000);
    }
  }, [formState?.success, isEditing, router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Admin' : 'Add Admin'}
        onBackClick={() => onCancel()}
      />

      {/* Form */}
      <form action={formAction} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-[946px] mx-auto">
        <div className="space-y-6">
          {/* Hidden fields for server action */}
          <input type="hidden" name="user_id" value={formData.user_id} />
          <input 
            type="hidden"
            name={isEditing ? "updated_by_admin_id" : "created_by_admin_id"}
            value={currentUserId}
          />
          
          {/* Server-side form errors */}
          {formState.errors?._form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{formState.errors._form[0]}</p>
            </div>
          )}

          {/* Resend invite message */}
          {resendInviteMessage && (
            <div className={`border rounded-lg p-4 mb-4 ${
              resendInviteMessage.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                resendInviteMessage.type === 'success' 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                {resendInviteMessage.text}
              </p>
            </div>
          )}

          {/* Row 1: User ID & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="User ID"
              value={formData.user_id}
              readOnly
              placeholder={isEditing ? (formData.user_id || 'User ID') : (formData.user_id || 'Auto-generated by system')}
              onChange={(value) => handleInputChange('user_id', value)}
            />

            <SelectField
              label="Role"
              name="role"
              value={formData.role}
              onChange={(value) => handleInputChange('role', value)}
              options={[
                { value: 'admin', label: 'Admin' }
              ]}
              required
              error={clientErrors.role || formState.errors?.role?.[0]}
            />
          </div>

          {/* Row 2: First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={(value) => handleInputChange('first_name', value)}
              placeholder="Enter first name"
              required
              error={clientErrors.first_name || formState.errors?.first_name?.[0]}
            />

            <InputField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={(value) => handleInputChange('last_name', value)}
              placeholder="Enter last name"
              required
              error={clientErrors.last_name || formState.errors?.last_name?.[0]}
            />
          </div>

          {/* Row 3: Email */}
          <InputField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            placeholder="Enter email address"
            required
            readOnly={isEditing}
            error={clientErrors.email || formState.errors?.email?.[0]}
          />

          {/* Row 4: Organization & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Organization/Merchant"
              name="organization"
              value={formData.organization}
              onChange={(value) => handleInputChange('organization', value)}
              options={[
                ...organizationOptions.map(org => ({ value: org, label: org })),
                // Show current organization if it's not in the predefined list
                ...(isEditing && formData.organization && !organizationOptions.includes(formData.organization) 
                  ? [{ value: formData.organization, label: formData.organization }] 
                  : []
                )
              ]}
              required
              error={clientErrors.organization || formState.errors?.organization?.[0]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              {isEditing && formData.status.toLowerCase() !== 'pending'
                ? <SelectField
                    label=""
                    name="status"
                    value={formData.status.toLowerCase()}
                    onChange={(value) => handleInputChange('status', value)}
                    options={statusOptions.map(status => ({ 
                      value: status, 
                      label: status.charAt(0).toUpperCase() + status.slice(1) 
                    }))}
                  />

                : <input
                    type="text"
                    name="status"
                    value="Pending"
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 text-gray-500 cursor-not-allowed"
                    style={{ borderColor: '#D9D9D9' }}
                  />
              }
            </div>
          </div>

          {/* Row 5: Internal Notes */}
          <TextAreaField
            label="Internal Notes"
            name="internal_notes"
            value={formData.internal_notes}
            onChange={(value) => handleInputChange('internal_notes', value)}
            rows={4}
            placeholder="Enter any internal notes about this admin"
          />

          {/* Row 6: Password Note - Only for new admins */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  User will be receiving an invite link along with temporary password
                </p>
              </div>
            </div>
          )}

          {/* Row 7: Action Buttons */}
          <div className="flex justify-between pt-4">
            <div>
              <Button
                label="Cancel"
                variant="secondary"
                onClick={onCancel}
                type="button"
              />
            </div>

            <div className='flex gap-4'>
              {(isEditing && formData.status.toLowerCase() === 'pending') &&
                <Button
                  label={resendInviteLoading ? "Sending..." : "Resend Invite"}
                  variant="primary"
                  onClick={handleResendInvite}
                  disabled={resendInviteLoading}
                  type="button"
                />
              }

              <SubmitButton 
                isEditing={isEditing}
                disabled={
                  !!clientErrors.role || 
                  !!clientErrors.email ||
                  !!clientErrors.first_name ||
                  !!clientErrors.last_name ||
                  !!clientErrors.organization ||
                  !formData.role ||
                  !formData.email ||
                  !formData.first_name ||
                  !formData.last_name ||
                  !formData.organization
                }
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
