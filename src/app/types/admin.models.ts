export type UserRole = 'Member' | 'Activity Leader' | 'Vice President' | 'Admin';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type EventStatus = 'draft' | 'published' | 'closed' | 'completed';
export type RegistrationStatus = 'registered' | 'cancelled' | 'completed' | 'waitlisted';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type AnnouncementStatus = 'draft' | 'published';

export interface User {
  id: string;
  avatar: string;
  name: string;
  studentId: string;
  department: string;
  grade: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  cover: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  deadline: string;
  capacity: number;
  currentCount: number;
  category: string;
  tags: string[];
  status: EventStatus;
  createdBy: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  paymentStatus: PaymentStatus;
  checkIn: boolean;
  status: RegistrationStatus;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  cover: string;
  isPinned: boolean;
  status: AnnouncementStatus;
  createdBy: string;
  createdAt: string;
}

export type PermissionKey =
  | 'Dashboard'
  | '社員管理'
  | '活動管理'
  | '公告管理'
  | '報名管理'
  | '幹部管理'
  | '權限管理'
  | '系統設定';

export const PERMISSION_KEYS: PermissionKey[] = [
  'Dashboard',
  '社員管理',
  '活動管理',
  '公告管理',
  '報名管理',
  '幹部管理',
  '權限管理',
  '系統設定',
];

export interface PermissionGroup {
  role: UserRole;
  permissions: Record<PermissionKey, boolean>;
}

export interface ClubSettings {
  logo: string;
  clubName: string;
  email: string;
  phone: string;
  fb: string;
  ig: string;
  discord: string;
  recruitmentUrl: string;
}
