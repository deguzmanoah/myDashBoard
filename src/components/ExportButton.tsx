'use client';

import React, { useTransition } from 'react';
import { Button } from '@/components';

interface ExportButtonProps {
  exportAction: (formData: FormData) => Promise<{
    success: boolean;
    csvContent?: string;
    filename?: string;
    error?: string;
  }>;
  selectedFilter: string;
  searchQuery: string;
  startDateTime?: string;
  endDateTime?: string;
}

export default function ExportButton({ exportAction, selectedFilter, searchQuery, startDateTime, endDateTime }: ExportButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('status', selectedFilter);
        formData.append('search', searchQuery);
        if (startDateTime) formData.append('start_date_time', startDateTime);
        if (endDateTime) formData.append('end_date_time', endDateTime);

        const result = await exportAction(formData);

        if (result.success && result.csvContent && result.filename) {
          // Create and trigger download
          const blob = new Blob([result.csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          console.error('Export failed:', result.error);
          alert(result.error || 'Export failed. Please try again.');
        }
      } catch (error) {
        console.error('Export error:', error);
        alert('Export failed. Please try again.');
      }
    });
  };

  return (
    <Button
      variant="secondary"
      label={isPending ? "Exporting..." : "Export"}
      onClick={handleExport}
      disabled={isPending}
    />
  );
}
