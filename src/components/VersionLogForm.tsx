'use client';

import React, { useState, useEffect, useActionState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Button, InputField, SelectField } from '@/components';
import {
  createVersionLog,
  updateVersionLog,
  type VersionLogFormState,
} from '@/lib/actions/version-log-actions';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

export type Platform = 'Web' | 'Mobile';
export type ReleaseType = 'Major' | 'Minor' | 'Patch';
export type ChangeType = 'Feature' | 'Improve' | 'Fix';
export type LogStatus = 'In Progress' | 'Published' | 'Deferred';

export interface ChangeItem {
  change_type: ChangeType;
  description: string;
}

export interface VersionLogFormData {
  id?: string;
  platform: Platform;
  releaseType: ReleaseType;
  version_number: string;
  release_date: string;
  changes: ChangeItem[];
  status: LogStatus;
}

interface VersionLogFormProps {
  initialData?: Partial<VersionLogFormData>;
  isEditing?: boolean;
  onCancel: () => void;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      disabled={pending}
      label={pending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Log'}
    />
  );
}

const defaultFormData: VersionLogFormData = {
  platform: 'Web',
  releaseType: 'Patch',
  version_number: '',
  release_date: '',
  changes: [{ change_type: 'Feature', description: '' }],
  status: 'In Progress',
};

const platformOptions = [
  { value: 'Web', label: 'Web' },
  { value: 'Mobile', label: 'Mobile' },
];

const releaseTypeOptions = [
  { value: 'Major', label: 'Major' },
  { value: 'Minor', label: 'Minor' },
  { value: 'Patch', label: 'Patch' },
];

const changeTypeOptions = [
  { value: 'Feature', label: 'Feature' },
  { value: 'Improve', label: 'Improve' },
  { value: 'Fix', label: 'Fix' },
];

const statusOptions = [
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Published', label: 'Published' },
  { value: 'Deferred', label: 'Deferred' },
];

export default function VersionLogForm({
  initialData,
  isEditing = false,
  onCancel,
}: VersionLogFormProps) {
  const router = useRouter();

  const [state, formAction] = useActionState(
    isEditing ? updateVersionLog : createVersionLog,
    { errors: {}, success: false } as VersionLogFormState
  );

  const [formData, setFormData] = useState<VersionLogFormData>({
    ...defaultFormData,
    ...initialData,
    changes:
      initialData?.changes && initialData.changes.length > 0
        ? initialData.changes
        : defaultFormData.changes,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle server response
  useEffect(() => {
    if (state.success) {
      showSuccessToast(isEditing ? 'Version log updated.' : 'Version log created.');
      router.push('/dashboard/version-logs');
    }
    if (state.errors?._form) {
      showErrorToast(state.errors._form[0]);
    }
  }, [state, isEditing, router]);

  const updateField = <K extends keyof VersionLogFormData>(
    key: K,
    value: VersionLogFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const updateChange = (index: number, field: keyof ChangeItem, value: string) => {
    setFormData((prev) => {
      const changes = [...prev.changes];
      changes[index] = { ...changes[index], [field]: value };
      return { ...prev, changes };
    });
    if (errors[`change_${index}_description`]) {
      setErrors((prev) => ({ ...prev, [`change_${index}_description`]: '' }));
    }
  };

  const addChange = () => {
    setFormData((prev) => ({
      ...prev,
      changes: [...prev.changes, { change_type: 'Feature', description: '' }],
    }));
  };

  const removeChange = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      changes: prev.changes.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.version_number.trim()) newErrors.version_number = 'Version number is required.';
    if (!formData.release_date) newErrors.release_date = 'Release date is required.';
    if (formData.changes.length === 0) newErrors.changes = 'At least one change is required.';

    formData.changes.forEach((change, i) => {
      if (!change.description.trim()) {
        newErrors[`change_${i}_description`] = 'Description is required.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!validate()) e.preventDefault();
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {/* Hidden fields for FormData */}
      {isEditing && <input type="hidden" name="id" value={formData.id ?? ''} />}
      <input type="hidden" name="release_type" value={formData.releaseType} />
      <input type="hidden" name="changes" value={JSON.stringify(formData.changes)} />
      {/* Row 1: Platform + Release Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Platform"
          name="platform"
          value={formData.platform}
          onChange={(v) => updateField('platform', v as Platform)}
          options={platformOptions}
          required
        />
        <SelectField
          label="Release Type"
          name="releaseType"
          value={formData.releaseType}
          onChange={(v) => updateField('releaseType', v as ReleaseType)}
          options={releaseTypeOptions}
          required
        />
      </div>

      {/* Row 2: Version Number + Release Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Version Number"
          name="version_number"
          value={formData.version_number}
          onChange={(v) => updateField('version_number', v)}
          placeholder="e.g. 1.2.3"
          required
          error={errors.version_number}
        />
        <InputField
          label="Release Date"
          name="release_date"
          type="date"
          value={formData.release_date}
          onChange={(v) => updateField('release_date', v)}
          required
          error={errors.release_date}
        />
      </div>

      {/* Changes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Changes <span className="text-red-500 ml-1">*</span>
          </label>
          <button
            type="button"
            onClick={addChange}
            className="flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            <Image src="/icons/icon-plus.svg" alt="Add" width={16} height={16} />
            Add Line
          </button>
        </div>

        {errors.changes && (
          <p className="text-xs text-red-500">{errors.changes}</p>
        )}

        <div className="space-y-2">
          {formData.changes.map((change, index) => (
            <div key={index} className="flex items-start gap-2">
              {/* Change type */}
              <div className="w-36 flex-shrink-0">
                <SelectField
                  label=""
                  name={`change_type_${index}`}
                  value={change.change_type}
                  onChange={(v) => updateChange(index, 'change_type', v)}
                  options={changeTypeOptions}
                />
              </div>

              {/* Description */}
              <div className="flex-1 version-log__change-description">
                <InputField
                  label=""
                  name={`change_description_${index}`}
                  value={change.description}
                  onChange={(v) => updateChange(index, 'description', v)}
                  placeholder="Describe the change…"
                  error={errors[`change_${index}_description`]}
                />
              </div>

              {/* Remove */}
              {formData.changes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeChange(index)}
                  className="mt-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="Remove change"
                >
                  <Image
                    src="/icons/icon-delete.svg"
                    alt="Remove"
                    width={20}
                    height={20}
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <SelectField
        label="Status"
        name="status"
        value={formData.status}
        onChange={(v) => updateField('status', v as LogStatus)}
        options={statusOptions}
        required
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          label="Cancel"
          onClick={onCancel}
        />
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  );
}
