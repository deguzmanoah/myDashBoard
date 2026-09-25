export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  last_updated: string;
  created_by_admin_id: number;
  admin_name: string;
  status: 'Active' | 'Inactive';
  created_date: string;
  updated_date: string;
}

export const mockFAQs = {
  "page": 1,
  "limit": 10,
  "total_items": 4,
  "items": [
    {
      "id": 1,
      "question": "How do I start charging my electric vehicle?",
      "answer": "<p>To start charging your electric vehicle, follow these simple steps:</p><ol><li>Park your vehicle near the charging station</li><li>Connect the charging cable to your vehicle</li><li>Use the mobile app to scan the QR code or enter the station ID</li><li>Select your preferred payment method</li><li>Start the charging session</li></ol><p>For more detailed instructions, please refer to our user manual.</p>",
      "category": "Charging",
      "last_updated": "2025-10-30T14:30:00",
      "created_by_admin_id": 1,
      "admin_name": "John Smith",
      "status": "Active" as const,
      "created_date": "2025-10-15T10:00:00",
      "updated_date": "2025-10-30T14:30:00"
    },
    {
      "id": 2,
      "question": "What payment methods are accepted?",
      "answer": "<p>We accept the following payment methods:</p><ul><li><strong>Credit/Debit Cards:</strong> Visa, MasterCard, American Express</li><li><strong>Digital Wallets:</strong> Apple Pay, Google Pay, Samsung Pay</li><li><strong>Mobile Payment:</strong> PayPal, Venmo</li><li><strong>Subscription Plans:</strong> Monthly and annual charging plans</li></ul><p>All payments are processed securely through our encrypted payment gateway.</p>",
      "category": "Payments",
      "last_updated": "2025-10-28T09:15:00",
      "created_by_admin_id": 2,
      "admin_name": "Sarah Johnson",
      "status": "Active" as const,
      "created_date": "2025-10-20T11:30:00",
      "updated_date": "2025-10-28T09:15:00"
    },
    {
      "id": 3,
      "question": "How long does it take to fully charge my vehicle?",
      "answer": "<p>Charging time depends on several factors:</p><ul><li><strong>Battery capacity:</strong> Larger batteries take longer to charge</li><li><strong>Charging speed:</strong> Our stations offer different charging speeds (Level 2, DC Fast Charging)</li><li><strong>Current battery level:</strong> Charging slows down as the battery approaches full capacity</li></ul><p>Typical charging times:</p><ul><li><strong>Level 2 (AC):</strong> 4-8 hours for full charge</li><li><strong>DC Fast Charging:</strong> 30-60 minutes to 80% capacity</li></ul>",
      "category": "Charging",
      "last_updated": "2025-11-01T16:45:00",
      "created_by_admin_id": 1,
      "admin_name": "John Smith",
      "status": "Inactive" as const,
      "created_date": "2025-11-01T16:45:00",
      "updated_date": "2025-11-01T16:45:00"
    },
    {
      "id": 4,
      "question": "Can I reserve a charging station in advance?",
      "answer": "<p>Yes! You can reserve charging stations through our mobile app:</p><ol><li>Open the app and find available stations near you</li><li>Select the station you want to reserve</li><li>Choose your preferred time slot</li><li>Confirm your reservation</li></ol><p><strong>Important notes:</strong></p><ul><li>Reservations can be made up to 24 hours in advance</li><li>You have a 10-minute grace period after your reserved time</li><li>Cancellations must be made at least 30 minutes before your reserved time</li></ul>",
      "category": "Navigation",
      "last_updated": "2025-10-25T13:20:00",
      "created_by_admin_id": 3,
      "admin_name": "Mike Wilson",
      "status": "Active" as const,
      "created_date": "2025-10-22T09:00:00",
      "updated_date": "2025-10-25T13:20:00"
    }
  ]
};

export const faqStatuses = ['All', 'Active', 'Inactive'];
export const faqCategories = ['All', 'Charging', 'Payments', 'Navigation', 'Support', 'Usage'];
