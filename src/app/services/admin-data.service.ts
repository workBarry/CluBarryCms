import { Injectable, signal } from '@angular/core';
import { announcements, events, permissions, registrations, settings, users } from '../data/mock-admin-data';
import { Announcement, ClubSettings, Event, PermissionGroup, Registration, User } from '../types/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  readonly users = signal<User[]>(users.map((user) => ({ ...user })));
  readonly events = signal<Event[]>(events.map((event) => ({ ...event })));
  readonly registrations = signal<Registration[]>(registrations.map((registration) => ({ ...registration })));
  readonly announcements = signal<Announcement[]>(announcements.map((announcement) => ({ ...announcement })));
  readonly permissions = signal<PermissionGroup[]>(permissions.map((group) => ({ role: group.role, permissions: { ...group.permissions } })));
  readonly settings = signal<ClubSettings>({ ...settings });

  deleteUser(id: number): void {
    this.users.update((items) => items.filter((item) => item.id !== id));
  }

  upsertUser(user: User): void {
    this.users.update((items) => {
      const exists = items.some((item) => item.id === user.id);
      return exists ? items.map((item) => (item.id === user.id ? user : item)) : [{ ...user, id: Date.now() }, ...items];
    });
  }

  deleteEvent(id: number): void {
    this.events.update((items) => items.filter((item) => item.id !== id));
  }

  upsertEvent(event: Event): void {
    this.events.update((items) => {
      const exists = items.some((item) => item.id === event.id);
      return exists ? items.map((item) => (item.id === event.id ? event : item)) : [{ ...event, id: Date.now() }, ...items];
    });
  }

  toggleEventStatus(id: number): void {
    this.events.update((items) =>
      items.map((event) =>
        event.id === id ? { ...event, status: event.status === 'published' ? 'draft' : 'published' } : event,
      ),
    );
  }

  deleteAnnouncement(id: number): void {
    this.announcements.update((items) => items.filter((item) => item.id !== id));
  }

  upsertAnnouncement(announcement: Announcement): void {
    this.announcements.update((items) => {
      const exists = items.some((item) => item.id === announcement.id);
      return exists
        ? items.map((item) => (item.id === announcement.id ? announcement : item))
        : [{ ...announcement, id: Date.now() }, ...items];
    });
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

  updateRegistration(id: number, patch: Partial<Registration>): void {
    this.registrations.update((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
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
  }

  findUser(id: number): User | undefined {
    return this.users().find((user) => user.id === id);
  }

  findEvent(id: number): Event | undefined {
    return this.events().find((event) => event.id === id);
  }
}
