export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'suspended' | 'deactivated';
  organization: string;
  invite_name: string;
  last_login: string;
}

export const mockAdmins = {
    "page": 1,
    "limit": 10,
    "total_users": 2,
    "users": [
        {
            "user_id": 1,
            "first_name": "Azrael",
            "last_name": "Reyes",
            "role": "admin",
            "email": "azraelreyesm@gmail.com",
            "organization": "EV Charge",
            "status": "pending",
            "created_by_admin_id": 286,
            "invite_sent_at": "2025-09-28T12:14:17",
            "updated_at": "2025-09-28T12:14:17"
        },
        {
            "user_id": 2,
            "first_name": "Niko",
            "last_name": "De Guzman",
            "role": "admin",
            "email": "nikodeguzman@gmail.com",
            "organization": "EV Charge",
            "status": "active",
            "created_by_admin_id": 327,
            "invite_sent_at": "2025-09-28T12:18:18",
            "updated_at": "2025-09-28T13:27:52"
        }
    ]
}

export const adminStatuses = ['all', 'active', 'pending', 'suspended', 'deactivated'] as const;
