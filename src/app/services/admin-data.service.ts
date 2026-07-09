import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { announcements, events, permissions, registrations, settings, users } from '../data/mock-admin-data';
import { Announcement, ClubSettings, Event, PermissionGroup, Registration, User } from '../types/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly firebase = inject(FirebaseService);

  readonly users = signal<User[]>(users.map((user) => ({ ...user })));
  readonly events = signal<Event[]>(events.map((event) => ({ ...event })));
  readonly registrations = signal<Registration[]>(registrations.map((r) => ({ ...r })));
  readonly announcements = signal<Announcement[]>(announcements.map((a) => ({ ...a })));
  readonly permissions = signal<PermissionGroup[]>(permissions.map((g) => ({ role: g.role, permissions: { ...g.permissions } })));
  readonly settings = signal<ClubSettings>({ ...settings });
  readonly firebaseReady = signal(false);

  async syncFromFirebase(): Promise<void> {
    try {
      const [fbUsers, fbEvents, fbRegs, fbAnnouncements, fbPermissions, fbSettings] = await Promise.all([
        firstValueFrom(this.firebase.watchUsers()),
        firstValueFrom(this.firebase.watchEvents()),
        firstValueFrom(this.firebase.watchRegistrations()),
        firstValueFrom(this.firebase.watchAnnouncements()),
        firstValueFrom(this.firebase.watchPermissions()),
        firstValueFrom(this.firebase.watchSettings()),
      ]);

      if (fbUsers?.length) this.users.set(fbUsers as User[]);
      if (fbEvents?.length) this.events.set(fbEvents as Event[]);
      if (fbRegs?.length) this.registrations.set(fbRegs as Registration[]);
      if (fbAnnouncements?.length) this.announcements.set(fbAnnouncements as Announcement[]);
      if (fbPermissions?.length) this.permissions.set(fbPermissions as PermissionGroup[]);
      if (fbSettings) this.settings.set(fbSettings as ClubSettings);

      this.firebaseReady.set(true);
    } catch {
      console.warn('Firebase not configured, using mock data');
      this.firebaseReady.set(false);
    }
  }

  private get idField(): string {
    return this.firebaseReady() ? 'id' : 'id';
  }

  private async persistToFirebase(collection: string, action: 'create' | 'update' | 'delete', id?: string, data?: unknown): Promise<void> {
    if (!this.firebaseReady()) return;
    try {
      if (action === 'create') {
        await this.firebase.createEvent(data as Omit<Event, 'id'>);
      } else if (action === 'update' && id) {
        switch (collection) {
          case 'users': await this.firebase.updateUser(id, data as Partial<User>); break;
          case 'events': await this.firebase.updateEvent(id, data as Partial<Event>); break;
          case 'registrations': await this.firebase.updateRegistration(id, data as Partial<Registration>); break;
          case 'announcements': await this.firebase.updateAnnouncement(id, data as Partial<Announcement>); break;
        }
      } else if (action === 'delete' && id) {
        switch (collection) {
          case 'users': await this.firebase.deleteUser(id); break;
          case 'events': await this.firebase.deleteEvent(id); break;
          case 'announcements': await this.firebase.deleteAnnouncement(id); break;
        }
      }
    } catch (e) {
      console.error(`Firebase ${action} ${collection} failed:`, e);
    }
  }

  deleteUser(id: number | string): void {
    this.users.update((items) => items.filter((item) => String(item.id) !== String(id)));
    this.persistToFirebase('users', 'delete', String(id));
  }

  upsertUser(user: User): void {
    const isNew = !this.users().some((item) => item.id === user.id);
    this.users.update((items) => {
      const exists = items.some((item) => item.id === user.id);
      return exists ? items.map((item) => (item.id === user.id ? user : item)) : [{ ...user, id: Date.now() }, ...items];
    });
    if (isNew && this.firebaseReady()) {
      this.firebase.createUser(user);
    } else {
      this.persistToFirebase('users', 'update', String(user.id), user);
    }
  }

  deleteEvent(id: number | string): void {
    this.events.update((items) => items.filter((item) => String(item.id) !== String(id)));
    this.persistToFirebase('events', 'delete', String(id));
  }

  upsertEvent(event: Event): void {
    const isNew = !this.events().some((item) => item.id === event.id);
    this.events.update((items) => {
      const exists = items.some((item) => item.id === event.id);
      return exists ? items.map((item) => (item.id === event.id ? event : item)) : [{ ...event, id: Date.now() }, ...items];
    });
    if (isNew && this.firebaseReady()) {
      this.firebase.createEvent(event);
    } else {
      this.persistToFirebase('events', 'update', String(event.id), event);
    }
  }

  toggleEventStatus(id: number): void {
    this.events.update((items) =>
      items.map((event) =>
        event.id === id ? { ...event, status: event.status === 'published' ? 'draft' : 'published' } : event,
      ),
    );
  }

  deleteAnnouncement(id: number | string): void {
    this.announcements.update((items) => items.filter((item) => String(item.id) !== String(id)));
    this.persistToFirebase('announcements', 'delete', String(id));
  }

  upsertAnnouncement(announcement: Announcement): void {
    const isNew = !this.announcements().some((item) => item.id === announcement.id);
    this.announcements.update((items) => {
      const exists = items.some((item) => item.id === announcement.id);
      return exists
        ? items.map((item) => (item.id === announcement.id ? announcement : item))
        : [{ ...announcement, id: Date.now() }, ...items];
    });
    if (isNew && this.firebaseReady()) {
      this.firebase.createAnnouncement(announcement);
    } else {
      this.persistToFirebase('announcements', 'update', String(announcement.id), announcement);
    }
  }

  togglePinnedAnnouncement(id: number): void {
    this.announcements.update((items) =>
      items.map((announcement) =>
        announcement.id === id ? { ...announcement, isPinned: !announcement.isPinned } : announcement,
      ),
    );
  }

  toggleAnnouncementStatus(id: number): void {
    this.announcements.update((items) =>
      items.map((announcement) =>
        announcement.id === id
          ? { ...announcement, status: announcement.status === 'published' ? 'draft' : 'published' }
          : announcement,
      ),
    );
  }

  updateRegistration(id: number | string, patch: Partial<Registration>): void {
    this.registrations.update((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    this.persistToFirebase('registrations', 'update', String(id), patch);
  }

  setPermission(role: string, permission: string, value: boolean): void {
    this.permissions.update((groups) =>
      groups.map((group) =>
        group.role === role ? { ...group, permissions: { ...group.permissions, [permission]: value } } : group,
      ),
    );
  }

  updateSettings(value: ClubSettings): void {
    this.settings.set({ ...value });
    if (this.firebaseReady()) {
      this.firebase.updateSettings(value);
    }
  }

  findUser(id: number | string): User | undefined {
    return this.users().find((user) => String(user.id) === String(id));
  }

  findEvent(id: number | string): Event | undefined {
    return this.events().find((event) => String(event.id) === String(id));
  }
}
