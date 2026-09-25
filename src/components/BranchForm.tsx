"use client";

import React, { useState, useEffect, useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, PageHeader, InputField, SelectField, TextAreaField, GoogleMapsAddressSelector, RichTextEditor } from '@/components';
import { 
  createBranch, 
  updateBranch, 
  type BranchFormState
} from '@/lib/actions/branch-actions';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export interface BranchFormData {
  branch_id: string;
  station_name: string;
  city: string;
  region: string;
  zip_code: string;
  address: string;
  latitude: string;
  longitude: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  description_json: any;
  charger_location_image: File | string | null;
}

interface BranchFormProps {
  initialData?: Partial<BranchFormData>;
  isEditing?: boolean;
  onCancel?: () => void;
  currentUserId: string;
}

const defaultFormData: BranchFormData = {
  branch_id: '',
  station_name: '',
  city: '',
  region: '',
  zip_code: '',
  address: '',
  latitude: '',
  longitude: '',
  status: 'Active',
  description: '',
  description_json: null,
  charger_location_image: null
};

// Submit button component that uses useFormStatus
function SubmitButton({ isEditing, disabled }: { isEditing: boolean; disabled: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      label={
        pending 
          ? (isEditing ? 'Saving...' : 'Creating...') 
          : (isEditing ? 'Update Branch' : 'Save Branch')
      }
      variant="primary"
      disabled={pending || disabled}
      type="submit"
    />
  );
}

export default function BranchForm({
  initialData,
  isEditing = false,
  onCancel,
  currentUserId
}: BranchFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<BranchFormData>(defaultFormData);
  const [, setMapStatus] = useState({ isLoaded: false, hasError: true });

  // Handle cancel action - use provided onCancel or default navigation
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/dashboard/branches');
    }
  };

  const [clientErrors, setClientErrors] = useState({
    station_name: '',
    city: '',
    region: '',
    zip_code: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  // Form state for server action
  const initialState: BranchFormState = {};
  const [formState, formAction] = useActionState(
    isEditing ? updateBranch : createBranch, 
    initialState
  );

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Ensure description_json is properly handled - if it's a string, try to parse it
        description_json: (() => {
          if (!initialData.description_json) return null;
          if (typeof initialData.description_json === 'string') {
            try {
              return JSON.parse(initialData.description_json);
            } catch {
              return null;
            }
          }
          return initialData.description_json;
        })(),
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
        ? 'Branch updated successfully!' 
        : 'Branch created successfully!';
      showSuccessToast(successMessage);
      
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        router.push('/dashboard/branches');
      }, 1000);
    }
  }, [formState?.success, isEditing, router]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear client error when user starts typing and perform real-time validation
    if (field === 'station_name') {
      setClientErrors(prev => ({
        ...prev,
        station_name: value.trim() ? '' : 'Station name is required'
      }));
    } else if (field === 'city') {
      setClientErrors(prev => ({
        ...prev,
        city: value.trim() ? '' : 'City is required'
      }));
    } else if (field === 'region') {
      setClientErrors(prev => ({
        ...prev,
        region: value.trim() ? '' : 'Region is required'
      }));
    } else if (field === 'zip_code') {
      setClientErrors(prev => ({
        ...prev,
        zip_code: value.trim() ? '' : 'Zip code is required'
      }));
    } else if (field === 'address') {
      setClientErrors(prev => ({
        ...prev,
        address: value.trim() ? '' : 'Address is required'
      }));
    }
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    
    setFormData(prev => ({
      ...prev,
      charger_location_image: file
    }));
  };

  const handleAddressSelect = useCallback((addressData: {
    address: string;
    city: string;
    region: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  }) => {
    // Only update latitude and longitude, don't autopopulate address fields
    setFormData(prev => ({
      ...prev,
      latitude: addressData.latitude.toString(),
      longitude: addressData.longitude.toString(),
    }));

    // Clear errors for coordinates when they are populated
    setClientErrors(prev => ({
      ...prev,
      latitude: '',
      longitude: '',
    }));
  }, []);

  const handleMapStatusChange = useCallback((status: { isLoaded: boolean; hasError: boolean }) => {
    setMapStatus(status);
  }, []);

  // Memoized onChange handler for RichTextEditor to prevent focus issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDescriptionChange = useCallback(({ html, editorState }: { html: string; editorState: any }) => {
    setFormData(prev => ({
      ...prev,
      description: html,
      description_json: editorState
    }));
  }, []);

  // Helper function to check if form is valid
  const isFormValid = () => {
    // Check for basic field errors and required fields
    if (!!clientErrors.station_name || 
        !!clientErrors.city ||
        !!clientErrors.region ||
        !!clientErrors.zip_code ||
        !!clientErrors.address ||
        !formData.station_name ||
        !formData.city ||
        !formData.region ||
        !formData.zip_code ||
        !formData.address ||
        !formData.latitude ||
        !formData.longitude) {
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEditing ? "Edit Branch" : "Add New Branch"}
        onBackClick={handleCancel}
      />

      <div className="space-y-5 bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-[1140px] mx-auto">
        {/* Single Form with Server Action */}
        <form action={formAction}>
          <div className="space-y-5">
            {/* Hidden fields for server action */}
            <input type="hidden" name="branch_id" value={formData.branch_id} />
            <input type="hidden" name="admin_id" value={currentUserId} />
            <input type="hidden" name="latitude" value={formData.latitude} />
            <input type="hidden" name="longitude" value={formData.longitude} />
            <textarea name="description" value={formData.description} style={{ display: 'none' }} readOnly />
            <input type="hidden" name="description_json" value={JSON.stringify(formData.description_json)} />
            
            {/* Server-side form errors */}
            {formState.errors?._form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{formState.errors._form[0]}</p>
              </div>
            )}

            {/* General Info Section */}
            <div className='font-bold text-sm'>
              Branch Information
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {/* Branch ID */}
              <InputField
                label="Branch ID"
                name="branch_id"
                value={formData.branch_id}
                disabled
                placeholder={isEditing ? formData.branch_id : "Auto-generated by system"}
                onChange={(value) => handleInputChange('branch_id', value)}
              />

              {/* Status */}
              <SelectField
                label="Status"
                name="status"
                value={formData.status}
                onChange={(value) => handleInputChange('status', value)}
                required
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>

            {/* Station Name */}
            <InputField
              label="Station Name"
              name="station_name"
              value={formData.station_name}
              onChange={(value) => handleInputChange('station_name', value)}
              placeholder="e.g., MOA North Wing Station"
              required
              error={clientErrors.station_name || formState.errors?.station_name?.[0]}
            />

            <div className='font-bold text-sm pt-4'>
              Branch Image
            </div>

            {/* Upload Branch Location Image */}
            <div>
              <label htmlFor="branchLocationImage" className="block text-sm font-medium text-gray-700 mb-1">
                Upload Branch Location Image
              </label>

              <div className="mt-4 flex gap-4">
                {formData.charger_location_image && typeof formData.charger_location_image === 'object' ? (
                  // Show newly uploaded file
                  <Image
                    src={URL.createObjectURL(formData.charger_location_image)}
                    alt="Branch location"
                    width={100}
                    height={100}
                    className="object-cover rounded-md"
                  />
                ) : formData.charger_location_image && typeof formData.charger_location_image === 'string' ? (
                  // Show existing S3 image
                  <Image
                    src={formData.charger_location_image}
                    alt="Branch location"
                    width={100}
                    height={100}
                    className="object-cover rounded-md"
                  />
                ) : (
                  // Show placeholder
                  <Image
                    src="/upload-image-placeholder.svg"
                    alt="Upload photo"
                    width={100}
                    height={100}
                  />
                )}

                <div className='flex flex-col gap-4'>
                  <p className="text-sm italic">
                    Please upload square image, size less than 100KB
                  </p>

                  <div className="bg-[#F8FCFF] p-2 rounded-md flex items-center gap-4 text-sm">
                    <label
                      htmlFor="branchLocationImage"
                      className="cursor-pointer border border-black rounded-md py-2 px-4"
                    >
                      <span>Choose File</span>
                      <input
                        id="branchLocationImage"
                        name="charger_location"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>

                    <p>
                      {formData.charger_location_image && typeof formData.charger_location_image === 'object'
                        ? formData.charger_location_image.name
                        : formData.charger_location_image && typeof formData.charger_location_image === 'string'
                        ? "Current image loaded"
                        : "No file chosen"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className='font-bold text-sm pt-4'>
              Location Details
            </div>

            {/* Manual Address Fields */}
            <div className="space-y-4">
              {/* Address */}
              <TextAreaField
                label="Address"
                name="address"
                value={formData.address}
                onChange={(value) => handleInputChange('address', value)}
                placeholder="e.g., MOA Complex, Seaside Blvd"
                rows={2}
                required
                error={clientErrors.address || formState.errors?.address?.[0]}
              />

              {/* City, Region and Zip Code in 3 columns */}
              <div className="grid grid-cols-3 gap-4">
                <InputField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={(value) => handleInputChange('city', value)}
                  placeholder="e.g., Pasay City"
                  required
                  error={clientErrors.city || formState.errors?.city?.[0]}
                />

                <InputField
                  label="Region"
                  name="region"
                  value={formData.region}
                  onChange={(value) => handleInputChange('region', value)}
                  placeholder="e.g., Metro Manila"
                  required
                  error={clientErrors.region || formState.errors?.region?.[0]}
                />

                <InputField
                  label="Zip Code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={(value) => handleInputChange('zip_code', value)}
                  placeholder="e.g., 1300"
                  required
                  error={clientErrors.zip_code || formState.errors?.zip_code?.[0]}
                />
              </div>
            </div>

            {/* Google Maps Coordinate Selector */}
            <GoogleMapsAddressSelector
              onAddressSelect={handleAddressSelect}
              onMapStatusChange={handleMapStatusChange}
              placeholder="Search and select location on map to set coordinates..."
              initialLatitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
              initialLongitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
            />

          </div>
        </form>

        {/* RichTextEditor - Outside form to avoid conflicts */}
        <div className='font-bold text-sm pt-4'>
          Description
        </div>

        <RichTextEditor
          value={formData.description_json}
          onChange={handleDescriptionChange}
          error={formState.errors?.description?.[0]}
          placeholder="Additional details about this branch location..."
          minHeight={200}
          autoFocus={false}
          key={`rich-text-${formData.branch_id || 'new'}`} // Force re-render when switching between branches
        />

        {/* Action Buttons - At the bottom for natural flow */}
        <form action={formAction}>
          {/* Hidden fields for server action */}
          <input type="hidden" name="branch_id" value={formData.branch_id} />
          <input type="hidden" name="admin_id" value={currentUserId} />
          <input type="hidden" name="latitude" value={formData.latitude} />
          <input type="hidden" name="longitude" value={formData.longitude} />
          <input type="hidden" name="station_name" value={formData.station_name} />
          <input type="hidden" name="city" value={formData.city} />
          <input type="hidden" name="region" value={formData.region} />
          <input type="hidden" name="zip_code" value={formData.zip_code} />
          <input type="hidden" name="address" value={formData.address} />
          <input type="hidden" name="status" value={formData.status} />
          <textarea name="description" value={formData.description} style={{ display: 'none' }} readOnly />
          <input type="hidden" name="description_json" value={JSON.stringify(formData.description_json)} />
          
          {/* Handle file input for charger_location */}
          <input 
            type="file" 
            name="charger_location" 
            style={{ display: 'none' }} 
            ref={(input) => {
              if (input && formData.charger_location_image instanceof File) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(formData.charger_location_image);
                input.files = dataTransfer.files;
              }
            }}
          />
          {/* For existing images, send the URL as a separate field */}
          {!(formData.charger_location_image instanceof File) && (
            <input type="hidden" name="charger_location_url" value={formData.charger_location_image || ''} />
          )}

          <div className="flex justify-between space-x-3">
            <Button
              type="button"
              variant="secondary"
              label="Cancel"
              onClick={handleCancel}
            />
            
            <SubmitButton
              isEditing={isEditing}
              disabled={!isFormValid()}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
