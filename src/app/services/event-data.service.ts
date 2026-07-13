import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import {
  Announcement,
  CreateEventInput,
  Event,
  Registration,
  Session,
  UpdateEventInput,
} from '../types/admin.models';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class EventDataService {
  private readonly firebase = inject(FirebaseService);
  private subscription?: Subscription;

  readonly events = signal<Event[]>([]);
  readonly registrations = signal<Registration[]>([]);
  readonly announcements = signal<Announcement[]>([]);
  readonly sessions = signal<Session[]>([]);

  startSync(): void {
    if (this.subscription && !this.subscription.closed) return;
    this.subscription = new Subscription();
    this.subscription.add(this.watch(this.firebase.watchEvents(), this.events, 'events'));
    this.subscription.add(this.watch(this.firebase.watchRegistrations(), this.registrations, 'registrations'));
    this.subscription.add(this.watch(this.firebase.watchAnnouncements(), this.announcements, 'announcements'));
    this.subscription.add(this.watch(this.firebase.watchSessions(), this.sessions, 'sessions'));
  }

  stopSync(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.events.set([]);
    this.registrations.set([]);
    this.announcements.set([]);
    this.sessions.set([]);
  }

  findEvent(id: string): Event | undefined {
    return this.events().find((event) => event.id === id);
  }

  async createEvent(input: CreateEventInput, createdBy: string): Promise<void> {
    const id = crypto.randomUUID();
    await this.firebase.setEvent(id, { ...input, currentCount: 0, status: 'draft', createdBy, createdAt: '' });
  }

  async updateEvent(id: string, patch: UpdateEventInput): Promise<void> {
    const { currentCount: _cc, createdBy: _cb, createdAt: _ca, ...safe } = patch as Record<string, unknown> & UpdateEventInput;
    await this.firebase.updateEvent(id, safe);
  }

  async publishEvent(id: string): Promise<void> {
    await this.firebase.updateEvent(id, { status: 'published' });
  }

  async closeEvent(id: string): Promise<void> {
    await this.firebase.updateEvent(id, { status: 'closed' });
  }

  async completeEvent(id: string): Promise<void> {
    await this.firebase.updateEvent(id, { status: 'completed' });
  }

  async deleteEvent(id: string): Promise<void> {
    const [sessions, registrations] = await Promise.all([
      this.firebase.getSessionsByEvent(id),
      this.firebase.getRegistrationsByEvent(id),
    ]);
    if (sessions.length > 0 || registrations.length > 0) {
      throw new Error(`此活動有 ${sessions.length} 個場次及 ${registrations.length} 筆報名資料，請先刪除相關資料。`);
    }
    await this.firebase.deleteEvent(id);
  }

  toggleEventStatus(id: string): void {
    const current = this.events().find((event) => event.id === id);
    if (!current || (current.status !== 'draft' && current.status !== 'published')) return;
    const status = current.status === 'published' ? 'draft' : 'published';
    void this.firebase.updateEvent(id, { status });
  }

  upsertAnnouncement(announcement: Announcement): void {
    const existing = this.announcements().some((item) => item.id === announcement.id);
    if (existing) {
      this.report('announcement update', this.firebase.updateAnnouncement(announcement.id, announcement));
      return;
    }

    const id = crypto.randomUUID();
    const { id: _discarded, ...data } = announcement;
    this.report('announcement create', this.firebase.setAnnouncement(id, data));
  }

  deleteAnnouncement(id: string): void {
    this.report('announcement delete', this.firebase.deleteAnnouncement(id));
  }

  togglePinnedAnnouncement(id: string): void {
    const current = this.announcements().find((item) => item.id === id);
    if (!current) return;
    const isPinned = !current.isPinned;
    this.report('announcement pin update', this.firebase.updateAnnouncement(id, { isPinned }));
  }

  toggleAnnouncementStatus(id: string): void {
    const current = this.announcements().find((item) => item.id === id);
    if (!current) return;
    const status = current.status === 'published' ? 'draft' : 'published';
    this.report('announcement status update', this.firebase.updateAnnouncement(id, { status }));
  }

  updateRegistration(id: string, patch: Partial<Registration>): void {
    this.report('registration update', this.firebase.updateRegistration(id, patch));
  }

  upsertSession(session: Session): void {
    const existing = this.sessions().some((item) => item.id === session.id);
    if (existing) {
      this.report('session update', this.firebase.updateSession(session.id, session));
      return;
    }

    const { id: _discarded, ...data } = session;
    void this.firebase.createSession(data).catch((error) => {
      console.warn('Firebase session create failed:', error);
    });
  }

  toggleSessionOpen(id: string): void {
    const current = this.sessions().find((session) => session.id === id);
    if (!current || current.status === 'completed') return;
    const status = current.status === 'open' ? 'closed' : 'open';
    this.report('session status update', this.firebase.updateSession(id, { status }));
  }

  removeSession(id: string): void {
    this.report('session delete', this.firebase.deleteSession(id));
  }

  private watch<T>(source: Observable<T[]>, target: WritableSignal<T[]>, label: string): Subscription {
    return source.subscribe({
      next: (items) => target.set(items),
      error: (error) => console.warn(`Firebase ${label} sync failed:`, error),
    });
  }

  private report(action: string, operation: Promise<unknown>): void {
    void operation.catch((error) => console.warn(`Firebase ${action} failed:`, error));
  }
}
