export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'admin';
  gender?: string;
  department_id?: string;
  department?: Department;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Department {
  _id: string;
  name: string;
  office_location: {
    lat: number;
    lng: number;
  };
}

export interface AttendanceRecord {
  _id: string;
  user_id: string;
  punch_in?: {
    time: string;
    location: {
      lat: number;
      lng: number;
    };
  };
  punch_out?: {
    time: string;
    location: {
      lat: number;
      lng: number;
    };
  };
  is_late: boolean;
  overtime_hours: number;
  status: 'present' | 'absent' | 'late' | 'overtime';
  date: string;
}

export interface LeaveRequest {
  _id: string;
  user_id: string;
  user?: User;
  from_date: string;
  to_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Notification {
  _id: string;
  user_id: string;
  message: string;
  type: 'leave_update' | 'attendance_alert' | 'general';
  status: 'unread' | 'read';
  created_at: string;
}

export interface AdminSettings {
  _id: string;
  late_punch_time: string;
  mandatory_working_hours: number;
  office_location: {
    lat: number;
    lng: number;
  };
  failed_attempt_alert_threshold: number;
}

export interface FaceEncoding {
  _id: string;
  user_id: string;
  name: string;
  face_encoding: number[];
  created_at: string;
}