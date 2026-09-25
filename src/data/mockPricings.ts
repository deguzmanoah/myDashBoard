export interface Pricing {
  pricing_id: number;
  name: string;
  cost: number;
  rate: number;
  idle: number;
  admin_fee: number;
  created_date: string;
  updated_date: string;
  status: 'Active' | 'Inactive';
  created_by_admin_id: number;
  updated_by_admin_id: number;
  admin_name: string;
}

export const mockPricings = {
  "page": 1,
  "limit": 10,
  "total_items": 2,
  "items": [
    {
      "pricing_id": 2,
      "name": "Cavite AC Price",
      "cost": 9.0,
      "rate": 14.0,
      "idle": 600.0,
      "admin_fee": 1.0,
      "created_date": "2025-10-12T06:55:42",
      "updated_date": "2025-10-12T06:55:42",
      "status": "Active",
      "created_by_admin_id": 102,
      "updated_by_admin_id": 102,
      "admin_name": "Unknown"
    },
    {
      "pricing_id": 1,
      "name": "Makati AC Price - Updated",
      "cost": 8.75,
      "rate": 12.5,
      "idle": 550.0,
      "admin_fee": 0.5,
      "created_date": "2025-10-11T13:28:56",
      "updated_date": "2025-10-11T13:28:56",
      "status": "Active",
      "created_by_admin_id": 10,
      "updated_by_admin_id": 10,
      "admin_name": "Dianne David"
    }
  ]
}

export const pricingStatuses = ['All', 'Active', 'Inactive'];
