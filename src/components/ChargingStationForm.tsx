"use client";

import React, { useState, useEffect, useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, PageHeader, InputField, SelectField, QRCodeModal } from '@/components';
import { getActivePricings, type ApiPricing } from '@/lib/actions/pricing-actions';
import { getBranches, type ApiBranch } from '@/lib/actions/branch-actions';
import { 
  createChargingStation, 
  updateChargingStation, 
  type ChargingStationFormState
} from '@/lib/actions/charging-station-actions';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export interface ChargingStationFormData {
  charger_id: string;
  charger_code: string;
  power_output: string;
  charger_type: 'AC' | 'DC';
  installation_date: string;
  status: 'Active' | 'Deactivated' | 'Maintenance' | 'Error';
  branch_id: string;
  // Step 2 fields
  pricing_id: string;
  brand: string;
  manufacturer_location: string;
  warranty_expiration_date: string;
  firmware_version: string;
  serial_number: string;
  charger_location_image: File | string | null;
  // Connector data
  connectors: Array<{
    connector_id?: string;
    connector_code: string;
    ocpp_connector_number?: string;
    qr_code?: string;
    status: 'Active' | 'Deactivated' | 'Maintenance' | 'Error';
  }>;
}

interface ChargingStationFormProps {
  initialData?: Partial<ChargingStationFormData>;
  isEditing?: boolean;
  onCancel: () => void;
  currentUserId: string;
}

const defaultFormData: ChargingStationFormData = {
  charger_id: '',
  charger_code: '',
  power_output: '',
  charger_type: 'AC',
  installation_date: '',
  status: 'Active',
  branch_id: '',
  // Step 2 fields
  pricing_id: '',
  brand: '',
  manufacturer_location: '',
  warranty_expiration_date: '',
  firmware_version: '',
  serial_number: '',
  charger_location_image: null,
  connectors: [{
    connector_code: '',
    status: 'Active'
  }]
};

// Submit button component that uses useFormStatus
function SubmitButton({ isEditing, disabled, currentStep }: { isEditing: boolean; disabled: boolean; currentStep: number }) {
  const { pending } = useFormStatus();
  
  if (currentStep === 1) {
    return (
      <Button
        type="submit"
        variant="primary"
        label="Continue"
        disabled={pending || disabled}
      />
    );
  }
  
  return (
    <Button
      label={
        pending 
          ? (isEditing ? 'Saving...' : 'Creating...') 
          : (isEditing ? 'Update Station' : 'Save Station')
      }
      variant="primary"
      disabled={pending || disabled}
      type="submit"
    />
  );
}

export default function ChargingStationForm({
  initialData,
  isEditing = false,
  onCancel,
  currentUserId
}: ChargingStationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ChargingStationFormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [activePricings, setActivePricings] = useState<ApiPricing[]>([]);
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<{
    connector_id?: string;
    connector_code: string;
    ocpp_connector_number?: string;
    qr_code?: string;
  } | null>(null);

  const [clientErrors, setClientErrors] = useState({
    charger_code: '',
    power_output: '',
    branch_id: '',
    // Step 2 errors
    pricing_id: '',
    brand: '',
    manufacturer_location: '',
    warranty_expiration_date: '',
    firmware_version: '',
    serial_number: ''
  });

  // Form state for server action
  const initialState: ChargingStationFormState = {};
  const [formState, formAction] = useActionState(
    isEditing ? updateChargingStation : createChargingStation, 
    initialState
  );

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        charger_code: initialData.charger_code || '',
        power_output: initialData.power_output?.toString() || '',
        // Ensure connectors array is properly formatted
        connectors: initialData.connectors?.map(connector => ({
          connector_id: connector.connector_id || '',
          connector_code: connector.connector_code || '',
          ocpp_connector_number: connector.ocpp_connector_number || '',
          qr_code: connector.qr_code || '',
          status: connector.status || 'Active'
        })) || [{
          connector_code: '',
          status: 'Active'
        }]
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
        ? 'Charging station updated successfully!' 
        : 'Charging station created successfully!';
      showSuccessToast(successMessage);
      
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        router.push('/dashboard/charging-stations');
      }, 1000);
    }
  }, [formState?.success, isEditing, router]);

  // Fetch active pricings and branches for the form
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setPricingLoading(true);
        setBranchesLoading(true);
        
        const [pricingResult, branchResult] = await Promise.all([
          getActivePricings(),
          getBranches({ page: 1, limit: 100, status: 'Active', search: '' })
        ]);
        
        if (pricingResult.error) {
          console.error('Error fetching active pricings:', pricingResult.error);
        } else {
          setActivePricings(pricingResult.pricings || []);
        }
        
        setBranches(branchResult.branches || []);
      } catch (error) {
        console.error('Error fetching form data:', error);
      } finally {
        setPricingLoading(false);
        setBranchesLoading(false);
      }
    };

    fetchFormData();
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear client error when user starts typing and perform real-time validation
    if (field === 'charger_code') {
      setClientErrors(prev => ({
        ...prev,
        charger_code: value.trim() ? '' : 'Charger code is required'
      }));
    } else if (field === 'power_output') {
      const powerValue = parseFloat(value);
      setClientErrors(prev => ({
        ...prev,
        power_output: value && !isNaN(powerValue) && powerValue > 0 ? '' : 'Power output must be a valid positive number'
      }));
    } else if (field === 'branch_id') {
      setClientErrors(prev => ({
        ...prev,
        branch_id: value.trim() ? '' : 'Branch is required'
      }));
    }
  }, []);

  const handleAddConnector = () => {
    setFormData(prev => ({
      ...prev,
      connectors: [...prev.connectors, {
        connector_code: '',
        status: 'Active'
      }]
    }));
  };

  const handleRemoveConnector = (index: number) => {
    setFormData(prev => ({
      ...prev,
      connectors: prev.connectors.filter((_, i) => i !== index)
    }));
  };

  const handleConnectorChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      connectors: prev.connectors.map((connector, i) => 
        i === index ? { ...connector, [field]: value } : connector
      )
    }));
  };

  const showQRCodeModal = useCallback((connector: {
    connector_id?: string;
    connector_code: string;
    ocpp_connector_number?: string;
    qr_code?: string;
  }) => {
    setSelectedConnector(connector);
    setIsQRModalOpen(true);
  }, []);

  const handleCloseQRModal = useCallback(() => {
    setIsQRModalOpen(false);
    setSelectedConnector(null);
  }, []);

  const validateStep1 = (): boolean => {
    const newErrors = { ...clientErrors };
    let isValid = true;

    // Charger code validation
    if (!formData.charger_code.trim()) {
      newErrors.charger_code = 'Charger code is required';
      isValid = false;
    } else {
      newErrors.charger_code = '';
    }

    // Power output validation
    if (!formData.power_output.trim()) {
      newErrors.power_output = 'Power output is required';
      isValid = false;
    } else {
      const powerValue = parseFloat(formData.power_output);
      if (isNaN(powerValue) || powerValue <= 0) {
        newErrors.power_output = 'Power output must be a valid positive number';
        isValid = false;
      } else {
        newErrors.power_output = '';
      }
    }

    // Connector validation
    const hasEmptyConnectorCodes = formData.connectors.some(connector => 
      !connector?.connector_code?.trim()
    );
    
    if (hasEmptyConnectorCodes) {
      isValid = false;
      // You could show a toast or set a general error here if needed
    }

    setClientErrors(newErrors);
    return isValid;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  // Helper function to check if form is valid based on current step
  const isFormValid = () => {
    if (currentStep === 1) {
      // Step 1 validation: only check required Step 1 fields
      const hasValidConnectors = formData.connectors.every(connector => 
        connector?.connector_code?.trim() !== ''
      );
      
      return !clientErrors.charger_code && 
             !clientErrors.power_output &&
             formData.charger_code.trim() !== '' &&
             formData.power_output.trim() !== '' &&
             hasValidConnectors;
    } else {
      // Step 2 validation: check Step 2 required fields including branch_id
      return !clientErrors.branch_id &&
             formData.branch_id.trim() !== '' &&
             formData.pricing_id.trim() !== '' &&
             formData.brand.trim() !== '' &&
             formData.manufacturer_location.trim() !== '' &&
             formData.installation_date.trim() !== '' &&
             formData.warranty_expiration_date.trim() !== '' &&
             formData.firmware_version.trim() !== '' &&
             formData.serial_number.trim() !== '';
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEditing ? "Edit Charging Station" : "Add New Charging Station"}
        onBackClick={() => onCancel()}
      />

      {currentStep === 1 ? (
        // Step 1 Form
        <form onSubmit={handleContinue} className="space-y-5 bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-[1140px] mx-auto">
          <div className='font-bold text-sm'>
            General Info
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {/* Charger ID */}
            <InputField
              label="Charger ID"
              name="charger_id"
              value={formData.charger_id}
              disabled
              placeholder={isEditing ? formData.charger_id : "Auto-generated by system"}
              onChange={(value) => handleInputChange('charger_id', value)}
            />

            {/* Charger Code */}
            <InputField
              label="Charger Code"
              name="charger_code"
              value={formData.charger_code}
              onChange={(value) => handleInputChange('charger_code', value)}
              placeholder="e.g., CHG-1001"
              required
              error={clientErrors.charger_code}
              readOnly={isEditing}
            />
          </div>

          <div className='font-bold text-sm pt-4'>
            Charger Properties
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {/* Charger Type */}
            <SelectField
              label="Charger Type"
              name="charger_type"
              value={formData.charger_type}
              onChange={(value) => handleInputChange('charger_type', value)}
              options={[
                { value: 'AC', label: 'AC' },
                { value: 'DC', label: 'DC' }
              ]}
            />

            {/* Power Output */}
            <InputField
              label="Power Output (kW)"
              name="power_output"
              type="number"
              value={formData.power_output}
              onChange={(value) => handleInputChange('power_output', value)}
              placeholder="e.g., 50"
              required
              error={clientErrors.power_output}
            />
          </div>

          {/* Connectors Section */}
          <div className='space-y-5 mt-6'>
            <div className='font-bold text-sm pt-4'>
              Connectors
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {formData.connectors.map((connector, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Connector {index + 1}</h4>

                    <div className='flex gap-4'>
                      {formData.connectors.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          label="Remove"
                          onClick={() => handleRemoveConnector(index)}
                        />
                      )}
                    
                      {/* QR Code button for each connector - only in edit mode */}
                      {isEditing && (
                        <Button
                          type="button"
                          label="View QR Code"
                          variant="secondary"
                          icon="/icons/icon-qr.svg"
                          onClick={() => showQRCodeModal(connector)}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <InputField
                      label="Connector Code"
                      name={`connector_code_${index}`}
                      value={connector.connector_code}
                      onChange={(value) => handleConnectorChange(index, 'connector_code', value)}
                      placeholder="e.g., CNC-001"
                      required
                      readOnly={isEditing && !!connector.connector_id}
                    />
                    
                    {/* OCPP Connector Number - only shown in edit mode and read-only */}
                    {isEditing && (
                      <InputField
                        label="OCPP Connector Number"
                        name={`ocpp_connector_number_${index}`}
                        value={connector.ocpp_connector_number || ''}
                        onChange={() => {}} // No-op since it's read-only
                        placeholder="Generated by system"
                        disabled
                        readOnly
                      />
                    )}
                    
                    <SelectField
                      label="Status"
                      name={`connector_status_${index}`}
                      value={connector.status}
                      onChange={(value) => handleConnectorChange(index, 'status', value)}
                      options={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Busy', label: 'Busy' },
                        { value: 'Deactivated', label: 'Deactivated' },
                        { value: 'Error', label: 'Error' },
                        { value: 'Idle', label: 'Idle' },
                        { value: 'Inactive', label: 'Inactive' },
                        { value: 'Maintenance', label: 'Maintenance' }
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              label="Add Connector"
              onClick={handleAddConnector}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              label="Cancel"
              onClick={onCancel}
            />

            <div className='flex gap-4'>
              <SubmitButton
                isEditing={isEditing}
                disabled={!isFormValid()}
                currentStep={currentStep}
              />
            </div>
          </div>
        </form>
      ) : (
        // Step 2 Form with Server Action
        <form action={formAction} className="space-y-5 bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-[1140px] mx-auto">
          <div className="space-y-5">
            {/* Hidden fields for server action - Step 1 data */}
            <input type="hidden" name="charger_id" value={formData.charger_id} />
            <input type="hidden" name="admin_id" value={currentUserId} />
            <input type="hidden" name="branch_id" value={formData.branch_id} />
            <input type="hidden" name="charger_code" value={formData.charger_code} />
            <input type="hidden" name="charger_type" value={formData.charger_type} />
            <input type="hidden" name="power_output" value={formData.power_output} />
            <input type="hidden" name="connectors" value={JSON.stringify(formData.connectors)} />
            
            {/* Server-side form errors */}
            {formState.errors?._form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{formState.errors._form[0]}</p>
              </div>
            )}

            <div className="flex gap-4">
              {/* Column 1 */}
              <div className='space-y-5 flex-1'>
                <div className='font-bold text-sm'>
                  Branch, Status & Pricing
                </div>

                {/* Branch Selection */}
                <SelectField
                  label="Branch"
                  name="branch_id"
                  defaultValue={formData.branch_id}
                  onChange={(value) => handleInputChange('branch_id', value)}
                  placeholder={branchesLoading ? "Loading branches..." : "Select branch"}
                  required
                  error={clientErrors.branch_id}
                  options={branches.map(branch => ({
                    value: branch.branch_id?.toString() || '',
                    label: branch.station_name
                  }))}
                />

                {/* Status */}
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue={formData.status}
                  onChange={(value) => handleInputChange('status', value)}
                  required
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                    { value: 'Under Maintenance', label: 'Under Maintenance' },
                    { value: 'Decommissioned', label: 'Decommissioned' },
                    { value: 'Error', label: 'Error' }
                  ]}
                />

                {/* Pricing */}
                <SelectField
                  label="Pricing"
                  name="pricing_id"
                  defaultValue={formData.pricing_id}
                  onChange={(value) => handleInputChange('pricing_id', value)}
                  placeholder={pricingLoading ? "Loading pricings..." : "Select pricing"}
                  required
                  error={formState.errors?.pricing_id?.[0]}
                  options={[
                    ...activePricings
                      .filter((pricing: ApiPricing) => pricing.status === 'Active')
                      .map((pricing: ApiPricing) => ({
                        value: pricing.pricing_id?.toString() || '',
                        label: pricing.name
                      }))
                  ]}
                />

                <div className='font-bold text-sm'>
                  Pricing Preview
                </div>

                {/* Pricing preview */}
                {formData.pricing_id ? (
                  (() => {
                    const selectedPricing = activePricings.find((p: ApiPricing) => p.pricing_id?.toString() === formData.pricing_id);
                    return selectedPricing ? (
                      <div className="bg-[#F3F5F7] rounded-2xl p-4 space-y-3 border border-[#5F7889]">
                        <div className="grid grid-cols-1 gap-x-2 gap-y-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#5F7889]">Pricing Name:</span>
                            <span className="font-medium">{selectedPricing.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#5F7889]">Cost per kWh:</span>
                            <span className="font-medium">₱{selectedPricing.cost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#5F7889]">Rate per kWh:</span>
                            <span className="font-medium">₱{selectedPricing.rate.toFixed(2)}/min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#5F7889]">Idle Fee:</span>
                            <span className="font-medium">₱{selectedPricing.idle.toFixed(2)}/min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#5F7889]">Admin Fee:</span>
                            <span className="font-medium">₱{selectedPricing.admin_fee.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                    Select a pricing option to view details
                  </div>
                )}
              </div>

              <div className='w-px bg-gray-200'></div>

              {/* Column 2 */}
              <div className="space-y-5 flex-1">
                <div className='font-bold text-sm'>
                  Manufacturer Properties
                </div>

                {/* Brand */}
                <InputField
                  label="Brand"
                  name="brand"
                  defaultValue={formData.brand}
                  onChange={(value) => handleInputChange('brand', value)}
                  placeholder="e.g., Tesla, ChargePoint, ABB"
                  required
                  error={formState.errors?.brand?.[0]}
                />

                {/* Manufacturer Location */}
                <InputField
                  label="Manufacturer Location"
                  name="manufacturer_location"
                  defaultValue={formData.manufacturer_location}
                  onChange={(value) => handleInputChange('manufacturer_location', value)}
                  placeholder="e.g., China, USA, Germany"
                  required
                  error={formState.errors?.manufacturer_location?.[0]}
                />

                {/* Installation Date and Warranty Expiry Date in 2 columns */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Installation Date"
                    name="installation_date"
                    type="date"
                    defaultValue={formData.installation_date}
                    onChange={(value) => handleInputChange('installation_date', value)}
                    required
                    error={formState.errors?.installation_date?.[0]}
                  />

                  <InputField
                    label="Warranty Expiry Date"
                    name="warranty_expiration_date"
                    type="date"
                    defaultValue={formData.warranty_expiration_date}
                    onChange={(value) => handleInputChange('warranty_expiration_date', value)}
                    required
                    error={formState.errors?.warranty_expiration_date?.[0]}
                  />
                </div>

                {/* Firmware Version */}
                <InputField
                  label="Firmware Version"
                  name="firmware_version"
                  defaultValue={formData.firmware_version}
                  onChange={(value) => handleInputChange('firmware_version', value)}
                  placeholder="e.g., v2.1.3, 1.0.5"
                  required
                  error={formState.errors?.firmware_version?.[0]}
                />

                {/* Serial No. */}
                <InputField
                  label="Serial No."
                  name="serial_number"
                  defaultValue={formData.serial_number}
                  onChange={(value) => handleInputChange('serial_number', value)}
                  placeholder="e.g., SN123456789"
                  required
                  error={formState.errors?.serial_number?.[0]}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              label="Back"
              onClick={handleBack}
            />
            <SubmitButton
              isEditing={isEditing}
              disabled={!isFormValid()}
              currentStep={currentStep}
            />
          </div>
        </form>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={handleCloseQRModal}
        connector={selectedConnector}
        station={{
          charger_id: formData.charger_id ? parseInt(formData.charger_id) : undefined,
          station_name: branches.find(b => b.branch_id?.toString() === formData.branch_id)?.station_name || 'Unknown Branch',
          address: branches.find(b => b.branch_id?.toString() === formData.branch_id)?.address || 'Unknown Address',
          city: branches.find(b => b.branch_id?.toString() === formData.branch_id)?.city || 'Unknown City',
        }}
      />
    </div>
  );
}
