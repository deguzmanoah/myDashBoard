export interface ChargingStation {
  charger_id: number;
  station_name: string;
  charger_type: string;
  power_output: string;
  city: string;
  region: string;
  zip_code: string;
  address: string;
  latitude: string;
  longitude: string;
  coordinates: string | null;
  pricing_id: number;
  brand: string;
  manufacturer_location: string;
  installation_date: string;
  warranty_expiration_date: string;
  firmware_version: string;
  serial_number: string;
  status: 'Active' | 'Deactivated' | 'Maintenance' | 'Error';
  charger_created_date: string;
  charger_updated_date: string;
  created_by_admin_id: number;
  updated_by_admin_id: number;
  admin_name: string;
  qr_code?: string;
}

export const mockChargingStationsResponse = {
  "page": 1,
  "limit": 10,
  "total_items": 4,
  "items": [
    {
      "charger_id": 1125899906842627,
      "station_name": "NCR-Makati-Salcedo-BPI-3L-001 - Updated",
      "charger_type": "AC",
      "power_output": "22.0000",
      "city": "Makati",
      "region": "Metro Manila",
      "zip_code": "1635",
      "address": "Florence St. Salcedo Village - Tower A",
      "latitude": "14.551944",
      "longitude": "121.023056",
      "coordinates": null,
      "pricing_id": 2,
      "brand": "Zhong Chan",
      "manufacturer_location": "Shenzhen, China",
      "installation_date": "2025-10-16T12:00:00",
      "warranty_expiration_date": "2028-01-30T12:00:00",
      "firmware_version": "1.02",
      "serial_number": "12345600045645223",
      "status": "Active",
      "charger_created_date": "2025-10-11T18:42:17",
      "charger_updated_date": "2025-10-11T18:42:17",
      "created_by_admin_id": 2,
      "updated_by_admin_id": 5,
      "admin_name": "Niko De Guzman",
      "qr_code": null,
    },
    {
      "charger_id": 1125899906842625,
      "station_name": "NCR-Makati-Salcedo-BPI-3L-001 - Updated",
      "charger_type": "AC",
      "power_output": "22.0000",
      "city": "Makati",
      "region": "Metro Manila",
      "zip_code": "1635",
      "address": "Florence St. Salcedo Village - Tower A",
      "latitude": "14.551944",
      "longitude": "121.023056",
      "coordinates": null,
      "pricing_id": 1,
      "brand": "Zhong Chan",
      "manufacturer_location": "Shenzhen, China",
      "installation_date": "2025-10-16T12:00:00",
      "warranty_expiration_date": "2028-01-30T12:00:00",
      "firmware_version": "1.02",
      "serial_number": "12345600045645223",
      "status": "Active",
      "charger_created_date": "2025-10-09T16:52:20",
      "charger_updated_date": "2025-10-09T16:52:20",
      "created_by_admin_id": 3,
      "updated_by_admin_id": 5,
      "admin_name": "Test 1 Test 2",
      "qr_code": null,
    }
  ]
};

// Export individual items for easier access
export const mockChargingStations = mockChargingStationsResponse.items;

export const chargingStationStatuses = [
  'All',
  'Active',
  'Deactivated', 
  'Maintenance',
  'Error'
];
