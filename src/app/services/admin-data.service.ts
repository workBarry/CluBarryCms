import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { Announcement, Club, ClubMember, ClubSettings, Event, PermissionGroup, PermissionKey, PermissionLog, PERMISSION_KEYS, Registration, Session, User, UserRole } from '../types/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly firebase = inject(FirebaseService);
  private readonly auth = inject(AuthService);

  readonly users = signal<User[]>([]);
  readonly events = signal<Event[]>([]);
  readonly registrations = signal<Registration[]>([]);
  readonly announcements = signal<Announcement[]>([]);
  readonly permissions = signal<PermissionGroup[]>([]);
  readonly permissionLogs = signal<PermissionLog[]>([]);
  readonly clubs = signal<Club[]>([]);
  readonly clubMembers = signal<ClubMember[]>([]);
  readonly sessions = signal<Session[]>([]);
  readonly settings = signal<ClubSettings>({
    logo: 'CM',
    clubName: 'Club Management System',
    email: '',
    phone: '',
    fb: '',
    ig: '',
    discord: '',
    recruitmentUrl: '',
  });
  readonly ready = signal(false);

  async syncFromFirebase(): Promise<void> {
    try {
      const [fbUsers, fbEvents, fbRegs, fbAnnouncements, fbPermissions, fbSettings, fbPermissionLogs, fbClubs, fbClubMembers, fbSessions] = await Promise.all([
        firstValueFrom(this.firebase.watchUsers()),
        firstValueFrom(this.firebase.watchEvents()),
        firstValueFrom(this.firebase.watchRegistrations()),
        firstValueFrom(this.firebase.watchAnnouncements()),
        firstValueFrom(this.firebase.watchPermissions()),
        firstValueFrom(this.firebase.watchSettings()),
        firstValueFrom(this.firebase.watchPermissionLogs()),
        firstValueFrom(this.firebase.watchClubs()),
        firstValueFrom(this.firebase.watchAllClubMembers()),
        firstValueFrom(this.firebase.watchSessions()),
      ]);

      if (fbUsers) this.users.set(fbUsers as User[]);
      if (fbEvents) this.events.set(fbEvents as Event[]);
      if (fbRegs) this.registrations.set(fbRegs as Registration[]);
      if (fbAnnouncements) this.announcements.set(fbAnnouncements as Announcement[]);
      if (fbPermissions) this.permissions.set(fbPermissions as PermissionGroup[]);
      if (fbSettings) this.settings.set(fbSettings as ClubSettings);
      if (fbPermissionLogs) this.permissionLogs.set(fbPermissionLogs as PermissionLog[]);
      if (fbClubs) this.clubs.set(fbClubs as Club[]);
      if (fbClubMembers) this.clubMembers.set(fbClubMembers as ClubMember[]);
      if (fbSessions) this.sessions.set(fbSessions as Session[]);

      this.ready.set(true);
    } catch {
      console.warn('Firebase sync failed, data remains empty');
      this.ready.set(false);
    }
  }

  private async persist(action: 'update' | 'delete', collection: string, id: string, data?: unknown): Promise<void> {
    try {
      if (action === 'update') {
        switch (collection) {
          case 'users': await this.firebase.updateUser(id, data as Partial<User>); break;
          case 'events': await this.firebase.updateEvent(id, data as Partial<Event>); break;
          case 'registrations': await this.firebase.updateRegistration(id, data as Partial<Registration>); break;
          case 'announcements': await this.firebase.updateAnnouncement(id, data as Partial<Announcement>); break;
        }
      } else if (action === 'delete') {
        switch (collection) {
          case 'users': await this.firebase.deleteUser(id); break;
          case 'events': await this.firebase.deleteEvent(id); break;
          case 'announcements': await this.firebase.deleteAnnouncement(id); break;
        }
      }
    } catch (e) {
      console.warn(`Firebase ${action} ${collection} failed:`, e);
    }
  }

  deleteUser(id: string): void {
    this.users.update((items) => items.filter((item) => item.id !== id));
    this.persist('delete', 'users', id);
  }

  upsertUser(user: User): void {
    const existing = this.users().find((item) => item.id === user.id);
    if (existing) {
      this.users.update((items) => items.map((item) => (item.id === user.id ? user : item)));
      this.persist('update', 'users', user.id, user);
    } else {
      const { id, ...rest } = user;
      const newId = crypto.randomUUID();
      this.users.update((items) => [{ ...user, id: newId }, ...items]);
      this.firebase.setUser(newId, rest);
    }
  }

  deleteEvent(id: string): void {
    this.events.update((items) => items.filter((item) => item.id !== id));
    this.persist('delete', 'events', id);
  }

  upsertEvent(event: Event): void {
    const existing = this.events().find((item) => item.id === event.id);
    if (existing) {
      this.events.update((items) => items.map((item) => (item.id === event.id ? event : item)));
      this.persist('update', 'events', event.id, event);
    } else {
      const { id, ...rest } = event;
      const newId = crypto.randomUUID();
      this.events.update((items) => [{ ...event, id: newId }, ...items]);
      this.firebase.setEvent(newId, rest);
    }
  }

  toggleEventStatus(id: string): void {
    this.events.update((items) =>
      items.map((event) =>
        event.id === id ? { ...event, status: event.status === 'published' ? 'draft' : 'published' } : event,
      ),
    );
    const event = this.events().find((e) => e.id === id);
    if (event) this.persist('update', 'events', id, event);
  }

  deleteAnnouncement(id: string): void {
    this.announcements.update((items) => items.filter((item) => item.id !== id));
    this.persist('delete', 'announcements', id);
  }

  upsertAnnouncement(announcement: Announcement): void {
    const existing = this.announcements().find((item) => item.id === announcement.id);
    if (existing) {
      this.announcements.update((items) => items.map((item) => (item.id === announcement.id ? announcement : item)));
      this.persist('update', 'announcements', announcement.id, announcement);
    } else {
      const { id, ...rest } = announcement;
      const newId = crypto.randomUUID();
      this.announcements.update((items) => [{ ...announcement, id: newId }, ...items]);
      this.firebase.setAnnouncement(newId, rest);
    }
  }

  togglePinnedAnnouncement(id: string): void {
    this.announcements.update((items) =>
      items.map((announcement) =>
        announcement.id === id ? { ...announcement, isPinned: !announcement.isPinned } : announcement,
      ),
    );
  }

  toggleAnnouncementStatus(id: string): void {
    this.announcements.update((items) =>
      items.map((announcement) =>
        announcement.id === id
          ? { ...announcement, status: announcement.status === 'published' ? 'draft' : 'published' }
          : announcement,
      ),
    );
  }

  updateRegistration(id: string, patch: Partial<Registration>): void {
    this.registrations.update((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    this.persist('update', 'registrations', id, patch);
  }

  setPermission(role: string, permission: PermissionKey, value: boolean): void {
    this.permissions.update((groups) =>
      groups.map((group) =>
        group.role === role ? { ...group, permissions: { ...group.permissions, [permission]: value } } : group,
      ),
    );
    const group = this.permissions().find((g) => g.role === role);
    if (group) this.firebase.updatePermission(role, { permissions: group.permissions });
    this.logChange('update', role, permission, value);
  }

  createRole(role: string): void {
    const group: PermissionGroup = {
      role: role as UserRole,
      permissions: PERMISSION_KEYS.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<PermissionKey, boolean>),
    };
    this.permissions.update((groups) => [...groups, group]);
    this.firebase.createPermission(group);
    this.logChange('create', role);
  }

  hasPermission(permission: PermissionKey): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    const override = user.permissionsOverride?.[permission];
    if (override !== undefined) return override;
    const group = this.permissions().find((g) => g.role === user.role);
    return group?.permissions[permission] ?? false;
  }

  private logChange(action: PermissionLog['action'], role: string, permission?: PermissionKey, value?: boolean): void {
    const actor = this.auth.currentUser()?.name ?? 'system';
    this.firebase.addPermissionLog({ action, role, permission, value, actor, createdAt: new Date().toISOString() });
  }

  updateSettings(value: ClubSettings): void {
    this.settings.set({ ...value });
    this.firebase.updateSettings(value);
  }

  findUser(id: string): User | undefined {
    return this.users().find((user) => user.id === id);
  }

  findEvent(id: string): Event | undefined {
    return this.events().find((event) => event.id === id);
  }

  // --- Clubs ---
  upsertClub(club: Partial<Club> & { name: string }): void {
    const existing = club.id ? this.clubs().find((item) => item.id === club.id) : undefined;
    if (existing && club.id) {
      this.clubs.update((items) => items.map((item) => (item.id === club.id ? club as Club : item)));
      this.firebase.updateClub(club.id, club as Club);
    } else {
      const nameExists = !club.id && this.clubs().some((c) => c.name === club.name);
      if (nameExists) {
        console.warn(`Club "${club.name}" already exists`);
        return;
      }
      const { id, ...rest } = club;
      this.firebase.createClub(rest as Omit<Club, 'id'>).then((ref) => {
        this.clubs.update((items) => [{ ...rest, id: ref.id } as Club, ...items]);
      });
    }
  }

  updateClubStatus(id: string, status: Club['status']): void {
    if (!id) return;
    this.clubs.update((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    this.firebase.updateClub(id, { status });
  }

  removeClub(id: string): void {
    this.clubs.update((items) => items.filter((item) => item.id !== id));
    this.firebase.deleteClub(id);
  }

  // --- Club Members ---
  addClubMember(member: Omit<ClubMember, 'id'>): void {
    this.firebase.createClubMember(member).then((ref) => {
      this.clubMembers.update((items) => [{ ...member, id: ref.id }, ...items]);
    });
  }

  updateClubMemberRole(id: string, roleInClub: ClubMember['roleInClub']): void {
    this.clubMembers.update((items) => items.map((item) => (item.id === id ? { ...item, roleInClub } : item)));
    this.firebase.updateClubMember(id, { roleInClub });
  }

  suspendClubMember(id: string): void {
    this.clubMembers.update((items) => items.map((item) => (item.id === id ? { ...item, status: 'suspended' } : item)));
    this.firebase.updateClubMember(id, { status: 'suspended' });
  }

  removeClubMember(id: string): void {
    this.clubMembers.update((items) => items.filter((item) => item.id !== id));
    this.firebase.deleteClubMember(id);
  }

  // --- Sessions ---
  upsertSession(session: Session): void {
    const existing = this.sessions().find((item) => item.id === session.id);
    if (existing) {
      this.sessions.update((items) => items.map((item) => (item.id === session.id ? session : item)));
      this.firebase.updateSession(session.id, session);
    } else {
      const { id, ...rest } = session;
      this.firebase.createSession(rest).then((ref) => {
        this.sessions.update((items) => [{ ...session, id: ref.id }, ...items]);
      });
    }
  }

  toggleSessionOpen(id: string): void {
    this.sessions.update((items) =>
      items.map((item) => (item.id === id ? { ...item, status: item.status === 'open' ? 'closed' : 'open' } : item)),
    );
    const session = this.sessions().find((s) => s.id === id);
    if (session) this.firebase.updateSession(id, { status: session.status });
  }

  removeSession(id: string): void {
    this.sessions.update((items) => items.filter((item) => item.id !== id));
    this.firebase.deleteSession(id);
  }
}
