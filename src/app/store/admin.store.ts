import { Injectable, signal } from '@angular/core';
import { Announcement, ClubSettings, Event, PermissionGroup, Registration, User } from '../types/admin.models';
import { announcements, events, permissions, registrations, settings, users } from '../data/mock-admin-data';

export interface AdminState {
  users: User[];
  events: Event[];
  registrations: Registration[];
  announcements: Announcement[];
  permissions: PermissionGroup[];
  settings: ClubSettings;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminStore {
  readonly state = signal<AdminState>({
    users: users.map((u) => ({ ...u })),
    events: events.map((e) => ({ ...e })),
    registrations: registrations.map((r) => ({ ...r })),
    announcements: announcements.map((a) => ({ ...a })),
    permissions: permissions.map((g) => ({ role: g.role, permissions: { ...g.permissions } })),
    settings: { ...settings },
    loading: false,
  });

  setLoading(loading: boolean): void {
    this.state.update((s) => ({ ...s, loading }));
  }

  upsertUser(user: User): void {
    this.state.update((s) => {
      const exists = s.users.some((u) => u.id === user.id);
      return {
        ...s,
        users: exists
          ? s.users.map((u) => (u.id === user.id ? user : u))
          : [{ ...user, id: Date.now() }, ...s.users],
      };
    });
  }

  deleteUser(id: number): void {
    this.state.update((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
  }

  upsertEvent(event: Event): void {
    this.state.update((s) => {
      const exists = s.events.some((e) => e.id === event.id);
      return {
        ...s,
        events: exists
          ? s.events.map((e) => (e.id === event.id ? event : e))
          : [{ ...event, id: Date.now() }, ...s.events],
      };
    });
  }

  deleteEvent(id: number): void {
    this.state.update((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
  }

  toggleEventStatus(id: number): void {
    this.state.update((s) => ({
      ...s,
      events: s.events.map((e) =>
        e.id === id ? { ...e, status: e.status === 'published' ? 'draft' : 'published' } : e,
      ),
    }));
  }

  upsertAnnouncement(announcement: Announcement): void {
    this.state.update((s) => {
      const exists = s.announcements.some((a) => a.id === announcement.id);
      return {
        ...s,
        announcements: exists
          ? s.announcements.map((a) => (a.id === announcement.id ? announcement : a))
          : [{ ...announcement, id: Date.now() }, ...s.announcements],
      };
    });
  }

  deleteAnnouncement(id: number): void {
    this.state.update((s) => ({ ...s, announcements: s.announcements.filter((a) => a.id !== id) }));
  }

  togglePinnedAnnouncement(id: number): void {
    this.state.update((s) => ({
      ...s,
      announcements: s.announcements.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a)),
    }));
  }

  toggleAnnouncementStatus(id: number): void {
    this.state.update((s) => ({
      ...s,
      announcements: s.announcements.map((a) =>
        a.id === id ? { ...a, status: a.status === 'published' ? 'draft' : 'published' } : a,
      ),
    }));
  }

  updateRegistration(id: number, patch: Partial<Registration>): void {
    this.state.update((s) => ({
      ...s,
      registrations: s.registrations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  setPermission(role: string, permission: string, value: boolean): void {
    this.state.update((s) => ({
      ...s,
      permissions: s.permissions.map((g) =>
        g.role === role ? { ...g, permissions: { ...g.permissions, [permission]: value } } : g,
      ),
    }));
  }

  updateSettings(value: ClubSettings): void {
    this.state.update((s) => ({ ...s, settings: { ...value } }));
  }
}
