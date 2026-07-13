export type UserRole = 'Member' | 'Activity Leader' | 'Vice President' | 'Admin';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type EventStatus = 'draft' | 'published' | 'closed' | 'completed';
export type RegistrationStatus = 'registered' | 'cancelled' | 'completed' | 'waitlisted';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type AnnouncementStatus = 'draft' | 'published';
export type ClubStatus = 'pending' | 'active' | 'closed';
export type ClubMemberStatus = 'active' | 'pending' | 'suspended';
export type RoleInClub = 'President' | 'Officer' | 'Member';
export type SessionStatus = 'open' | 'closed' | 'completed';

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
  permissionsOverride?: Partial<Record<PermissionKey, boolean>>;
  createdAt: string;
}

export interface Event {
  id: string;
  clubId: string;
  title: string;
  cover: string;
  description: string;
  agenda: string[];
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

export interface CreateEventInput {
  clubId: string;
  title: string;
  cover: string;
  description: string;
  agenda: string[];
  location: string;
  startTime: string;
  endTime: string;
  deadline: string;
  capacity: number;
  category: string;
  tags: string[];
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface Registration {
  id: string;
  userId: string;
  clubId: string;
  eventId: string;
  sessionId: string;
  paymentStatus: PaymentStatus;
  checkIn: boolean;
  status: RegistrationStatus;
  createdAt: string;
}

export interface Announcement {
  id: string;
  clubId: string | null;
  title: string;
  content: string;
  attachmentUrl?: string;
  cover: string;
  isPinned: boolean;
  status: AnnouncementStatus;
  createdBy: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  logo: string;
  cover: string;
  description: string;
  category: string;
  tags: string[];
  status: ClubStatus;
  createdBy: string;
  createdAt: string;
}

export interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  roleInClub: RoleInClub;
  status: ClubMemberStatus;
  joinedAt: string;
}

export interface Session {
  id: string;
  eventId: string;
  clubId: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  currentCount: number;
  openToNonMember: boolean;
  status: SessionStatus;
  createdAt: string;
}

export type PermissionKey =
  | 'Dashboard'
  | '社團管理'
  | '社員管理'
  | '活動管理'
  | '公告管理'
  | '報名管理'
  | '幹部管理'
  | '權限管理'
  | '系統設定';

export const PERMISSION_KEYS: PermissionKey[] = [
  'Dashboard',
  '社團管理',
  '社員管理',
  '活動管理',
  '公告管理',
  '報名管理',
  '幹部管理',
  '權限管理',
  '系統設定',
];

export interface PermissionGroup {
  role: string;
  permissions: Record<PermissionKey, boolean>;
}

export interface PermissionLog {
  id?: string;
  action: 'update' | 'create';
  role: string;
  permission?: string;
  value?: boolean;
  actor: string;
  createdAt: string;
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
