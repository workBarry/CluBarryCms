export type UserRole = 'Member' | 'Activity Leader' | 'Vice President' | 'Admin';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type EventStatus = 'draft' | 'published' | 'closed' | 'completed';
export type RegistrationStatus = 'registered' | 'cancelled' | 'completed' | 'waitlisted';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type AnnouncementStatus = 'draft' | 'published';

export interface User {
  id: number;
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
  id: number;
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
  createdBy: number;
  createdAt: string;
}

export interface Registration {
  id: number;
  userId: number;
  eventId: number;
  paymentStatus: PaymentStatus;
  checkIn: boolean;
  status: RegistrationStatus;
  createdAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  cover: string;
  isPinned: boolean;
  status: AnnouncementStatus;
  createdBy: number;
  createdAt: string;
}

export interface PermissionGroup {
  role: UserRole;
  permissions: Record<string, boolean>;
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
