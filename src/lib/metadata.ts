import type { Metadata } from 'next';

export function createPageMetadata(title: string, description?: string): Metadata {
  return {
    title: `${title} | Charge`,
    description: description || `${title} - Charge admin dashboard for managing EV charging stations`,
  };
}

export const defaultMetadata: Metadata = {
  title: "Charge",
  description: "Admin dashboard for managing EV charging stations",
};
