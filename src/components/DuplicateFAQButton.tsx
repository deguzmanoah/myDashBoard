'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components';

interface DuplicateFAQButtonProps {
  faqId: string | number;
}

export default function DuplicateFAQButton({ faqId }: DuplicateFAQButtonProps) {
  return (
    <Link href={`/dashboard/app-cms/duplicate-faq/${faqId}`}>
      <Button
        variant="secondary"
        icon="/icons/icon-copy.svg"
        iconOnly
      />
    </Link>
  );
}
