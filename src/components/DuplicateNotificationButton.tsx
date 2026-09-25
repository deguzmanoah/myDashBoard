"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components';

interface DuplicateNotificationButtonProps {
  notificationId: string | number;
  className?: string;
}

export default function DuplicateNotificationButton({
  notificationId,
  className = ""
}: DuplicateNotificationButtonProps) {
  return (
    <Link href={`/dashboard/notifications/${notificationId}?mode=duplicate`}>
      <Button
        variant="secondary"
        icon="/icons/icon-copy.svg"
        iconOnly
        className={`shrink-0 ${className}`}
      />
    </Link>
  );
}
