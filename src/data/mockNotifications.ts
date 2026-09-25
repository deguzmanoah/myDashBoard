export interface Notification {
  id: number;
  title: string;
  message: string;
  target_audience: string;
  type: 'Update' | 'Reminder' | 'Maintenance';
  priority: 'Low' | 'Medium' | 'High';
  send_at: string;
  status: 'Scheduled' | 'Sent';
  created_by_admin_id: number;
  updated_by_admin_id: number;
  admin_name: string;
  created_date: string;
  updated_date: string;
}

export const mockNotifications = {
  "page": 1,
  "limit": 10,
  "total_items": 4,
  "items": [
    {
      "id": 4,
      "title": "System Maintenance Notice",
      "message": "Scheduled maintenance will occur on November 1st from 2:00 AM to 4:00 AM. Services may be temporarily unavailable.",
      "target_audience": "All Users",
      "type": "Maintenance",
      "priority": "High",
      "send_at": "2025-10-25T08:00:00",
      "status": "Sent",
      "created_by_admin_id": 102,
      "updated_by_admin_id": 102,
      "admin_name": "System Admin",
      "created_date": "2025-10-25T07:45:00",
      "updated_date": "2025-10-25T07:45:00"
    },
    {
      "id": 3,
      "title": "New Charging Station Available",
      "message": "A new fast charging station has been installed at Makati CBD. Now available for booking!",
      "target_audience": "All Users",
      "type": "Update",
      "priority": "Medium",
      "send_at": "2025-10-24T14:30:00",
      "status": "Sent",
      "created_by_admin_id": 10,
      "updated_by_admin_id": 10,
      "admin_name": "Dianne David",
      "created_date": "2025-10-24T14:00:00",
      "updated_date": "2025-10-24T14:00:00"
    },
    {
      "id": 2,
      "title": "Price Update Alert",
      "message": "Charging rates will be updated effective November 1st. Please check the new pricing structure.",
      "target_audience": "All Users",
      "type": "Reminder",
      "priority": "High",
      "send_at": null,
      "status": "Scheduled",
      "created_by_admin_id": 102,
      "updated_by_admin_id": 102,
      "admin_name": "System Admin",
      "created_date": "2025-10-23T16:20:00",
      "updated_date": "2025-10-23T16:20:00"
    },
    {
      "id": 1,
      "title": "Welcome to EV Charge Admin",
      "message": "Welcome to the new EV Charge admin dashboard. Explore all the new features and improvements.",
      "target_audience": "All Users",
      "type": "Update",
      "priority": "Low",
      "send_at": "2025-10-20T09:00:00",
      "status": "Sent",
      "created_by_admin_id": 10,
      "updated_by_admin_id": 10,
      "admin_name": "Dianne David",
      "created_date": "2025-10-20T08:30:00",
      "updated_date": "2025-10-20T08:30:00"
    }
  ]
};

export const notificationTypes = ['Update', 'Reminder', 'Maintenance'] as const;
export const notificationPriorities = ['Low', 'Medium', 'High'] as const;
export const notificationStatuses = ['Sent', 'Scheduled'] as const;
export const targetAudiences = ['All Users'] as const;
