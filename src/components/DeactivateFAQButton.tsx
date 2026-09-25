'use client';

import React, { useState } from 'react';
import { Button } from '@/components';

interface DeactivateFAQButtonProps {
  faq: {
    id: string | number;
    question: string;
    status: string;
    answer?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answer_json?: any;
    category?: string;
    order?: number;
  };
  onDeactivate: (formData: FormData) => Promise<void>;
}

export default function DeactivateFAQButton({ 
  faq, 
  onDeactivate 
}: DeactivateFAQButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (isSubmitting) return;

    const confirmMessage = `Are you sure you want to deactivate "${faq.question}"?`;

    if (!confirm(confirmMessage)) return;

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('id', faq.id.toString());
      formData.append('status', 'Inactive');
      formData.append('question', faq.question);
      formData.append('answer', faq.answer || '');
      formData.append('answer_json', JSON.stringify(faq.answer_json || {}));
      formData.append('category', faq.category || '');
      formData.append('order', (faq.order || 1).toString());
      
      await onDeactivate(formData);
    } catch (error) {
      console.error('Error deactivating FAQ:', error);
      alert('Failed to deactivate FAQ. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      icon="/icons/icon-delete.svg"
      iconOnly
      disabled={isSubmitting}
      className="shrink-0 border-charge-red"
      onClick={handleClick}
    />
  );
}
