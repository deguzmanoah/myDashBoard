"use client";

import React, { useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Button, PageHeader, InputField } from '@/components';
import { 
  createBanner, 
  updateBanner, 
  type BannerFormState,
  type ApiBanner 
} from '@/lib/actions/homepage-banners-actions';

export interface BannerFormData {
  id: string;
  title: string;
  image: File | string | null;
  url: string;
  is_published: boolean;
  order: number;
}

interface BannerFormProps {
  initialData?: Partial<ApiBanner>;
  isEditing?: boolean;
  onCancel: () => void;
}

const defaultFormData: BannerFormData = {
  id: '',
  title: '',
  image: null,
  url: '',
  is_published: false,
  order: 1,
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="submit"
      label={pending ? 'Saving...' : (isEditing ? 'Update Banner' : 'Create Banner')}
      variant="primary"
      disabled={pending}
    />
  );
}

export default function BannerForm({ 
  initialData, 
  isEditing = false,
  onCancel 
}: BannerFormProps) {
  // Initialize form data
  const [formData, setFormData] = useState<BannerFormData>({
    ...defaultFormData,
    ...initialData,
    id: initialData?.id?.toString() || '',
    is_published: initialData?.is_published || false,
    order: initialData?.order || 1,
    image: initialData?.image || null,
  });

  // Action state for form submission
  const [state, formAction] = useActionState<BannerFormState, FormData>(
    isEditing ? updateBanner : createBanner,
    {}
  );

  // Handle form field changes
  const handleInputChange = (field: keyof BannerFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle file change for image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle form submission with proper error handling
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formDataObj = new FormData(event.currentTarget);

    // If there's a file, convert it to base64 and add to form data
    if (formData.image && typeof formData.image === 'object') {
      try {
        const base64Image = await convertFileToBase64(formData.image);
        formDataObj.set('image_base64', base64Image);
        // Don't delete the 'image' field - we need it for existing URLs
      } catch (error) {
        console.error('Error converting image to base64:', error);
        return; // Don't submit if image conversion fails
      }
    }

    // Submit the form data using startTransition
    React.startTransition(() => {
      formAction(formDataObj);
    });
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Banner' : 'Add New Banner'}
        description={isEditing ? 'Update banner information' : 'Create a new homepage banner'}
        onBackClick={handleCancel}
      />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden ID field for editing */}
          {isEditing && formData.id && (
            <input type="hidden" name="id" value={formData.id} />
          )}

          {/* Handle file input for image */}
          <input
            type="file" 
            name="image"
            style={{ display: 'none' }} 
            ref={(input) => {
              if (input && formData.image instanceof File) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(formData.image);
                input.files = dataTransfer.files;
              }
            }}
          />
          {/* For existing images, send the URL as a separate field */}
          {!(formData.image instanceof File) && (
            <input type="hidden" name="image_url" value={formData.image || ''} />
          )}

          {/* Hidden fields for form data */}
          <input type="hidden" name="title" value={formData.title} />
          <input type="hidden" name="url" value={formData.url} />
          <input type="hidden" name="order" value={formData.order.toString()} />
          <input type="hidden" name="is_published" value={formData.is_published.toString()} />

          {/* Banner Image Upload - First Field */}
          <div className="space-y-4">
            {/* Full-width banner preview - centered */}
            <div className="flex justify-center">
              {(formData.image && typeof formData.image === 'object') || 
               (formData.image && typeof formData.image === 'string') ? (
                <div className="w-full max-w-3xl">
                  <div className="relative w-full h-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <Image
                      src={formData.image && typeof formData.image === 'object' 
                        ? URL.createObjectURL(formData.image)
                        : formData.image as string
                      }
                      alt="Banner preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 768px"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">Banner preview (full width)</p>
                </div>
              ) : (
                <div className="w-full max-w-3xl">
                  <div className="relative w-full h-48 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <Image
                        src="/upload-image-placeholder.svg"
                        alt="Upload banner image"
                        width={64}
                        height={64}
                        className="mx-auto mb-2 opacity-50"
                      />
                      <p className="text-sm text-gray-500">Banner preview will appear here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-4 items-center">
              <p className="text-sm italic text-gray-600 text-center">
                Please upload an image, size less than 2MB. Recommended dimensions: 800x400px
              </p>

              <div className="bg-[#F8FCFF] p-2 rounded-md flex items-center gap-4 text-sm">
                <label
                  htmlFor="bannerImage"
                  className="cursor-pointer border border-black rounded-md py-2 px-4 hover:bg-gray-50 transition-colors"
                >
                  <span>Choose File</span>
                  <input
                    id="bannerImage"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>

                <p className="text-gray-600">
                  {formData.image && typeof formData.image === 'object'
                    ? formData.image.name
                    : formData.image && typeof formData.image === 'string'
                    ? "Current image loaded"
                    : "No file chosen"
                  }
                </p>
              </div>
              
              {state.errors?.image && (
                <p className="text-sm text-red-600 text-center">{state.errors.image[0]}</p>
              )}
            </div>
          </div>

          {/* Title Field */}
          <InputField
            id="title"
            label="Banner Title"
            name="title"
            value={formData.title}
            onChange={(value) => handleInputChange('title', value)}
            placeholder="Enter banner title"
            required
            error={state.errors?.title?.[0]}
          />

          {/* Target URL Field */}
          <div className="space-y-2">
            <InputField
              id="url"
              label="Target URL"
              name="url"
              value={formData.url}
              onChange={(value) => handleInputChange('url', value)}
              placeholder="/promotions/winter-special or https://example.com"
              error={state.errors?.url?.[0]}
            />
            <p className="text-sm text-gray-500">URL where users will be redirected when they tap the banner (leave empty if no redirect needed)</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Field */}
            <div className="space-y-2">
              <InputField
                id="order"
                label="Display Order"
                name="order"
                type="number"
                value={formData.order.toString()}
                onChange={(value) => handleInputChange('order', parseInt(value) || 1)}
                placeholder="1"
                required
                min="1"
                error={state.errors?.order?.[0]}
              />
              <p className="text-sm text-gray-500">Lower numbers will be displayed first</p>
            </div>

            {/* Published Checkbox */}
            <div className="flex flex-col pt-7">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={(e) => handleInputChange('is_published', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                  Publish Banner
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Check this to make the banner visible on the website
              </p>
              {state.errors?.is_published && (
                <p className="text-sm text-red-600 mt-1">{state.errors.is_published[0]}</p>
              )}
            </div>
          </div>

          {/* General Error Messages */}
          {state.errors?.general && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="text-sm text-red-700">
                {state.errors.general.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              label="Cancel"
              variant="secondary"
              onClick={handleCancel}
            />
            <SubmitButton isEditing={isEditing} />
          </div>
        </form>
      </div>
    </div>
  );
}
