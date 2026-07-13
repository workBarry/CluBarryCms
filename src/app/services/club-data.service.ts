import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { Club, ClubMember } from '../types/admin.models';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class ClubDataService {
  private readonly firebase = inject(FirebaseService);
  private readonly auth = inject(AuthService);
  private subscription?: Subscription;

  readonly clubs = signal<Club[]>([]);
  readonly clubMembers = signal<ClubMember[]>([]);
  readonly manageableClubs = computed(() => {
    const clubs = Array.from(new Map(this.clubs().map((club) => [club.id, club])).values())
      .filter((club) => club.status !== 'closed');
    if (this.auth.isAdmin) return clubs;

    const userId = this.auth.currentUser()?.id;
    const manageableIds = new Set(
      this.clubMembers()
        .filter((member) => (
          member.userId === userId
          && member.roleInClub !== 'Member'
          && member.status === 'active'
        ))
        .map((member) => member.clubId),
    );
    return clubs.filter((club) => manageableIds.has(club.id));
  });

  startSync(): void {
    if (this.subscription && !this.subscription.closed) return;
    this.subscription = new Subscription();
    this.subscription.add(this.firebase.watchClubs().subscribe({
      next: (clubs) => this.clubs.set(clubs),
      error: (error) => console.warn('Firebase clubs sync failed:', error),
    }));
    this.subscription.add(this.firebase.watchAllClubMembers().subscribe({
      next: (members) => this.clubMembers.set(members),
      error: (error) => console.warn('Firebase club members sync failed:', error),
    }));
  }

  stopSync(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.clubs.set([]);
    this.clubMembers.set([]);
  }

  upsertClub(club: Partial<Club> & { name: string }): void {
    const existing = club.id ? this.clubs().find((item) => item.id === club.id) : undefined;
    if (existing && club.id) {
      const updated = { ...existing, ...club };
      this.clubs.update((items) => items.map((item) => (item.id === club.id ? updated : item)));
      this.report('club update', this.firebase.updateClub(club.id, updated));
      return;
    }

    if (this.clubs().some((item) => item.name === club.name)) return;
    const { id: _discarded, ...data } = club;
    this.report('club create', this.firebase.createClub(data as Omit<Club, 'id'>));
  }

  updateClubStatus(id: string, status: Club['status']): void {
    if (!id) return;
    this.clubs.update((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    this.report('club status update', this.firebase.updateClub(id, { status }));
  }

  removeClub(id: string): void {
    this.clubs.update((items) => items.filter((item) => item.id !== id));
    this.report('club delete', this.firebase.deleteClub(id));
  }

  addClubMember(member: Omit<ClubMember, 'id'>): void {
    this.report('club member create', this.firebase.createClubMember(member));
  }

  updateClubMemberRole(id: string, roleInClub: ClubMember['roleInClub']): void {
    this.clubMembers.update((items) => items.map((item) => (
      item.id === id ? { ...item, roleInClub } : item
    )));
    this.report('club member role update', this.firebase.updateClubMember(id, { roleInClub }));
  }

  suspendClubMember(id: string): void {
    this.clubMembers.update((items) => items.map((item) => (
      item.id === id ? { ...item, status: 'suspended' } : item
    )));
    this.report('club member suspension', this.firebase.updateClubMember(id, { status: 'suspended' }));
  }

  removeClubMember(id: string): void {
    this.clubMembers.update((items) => items.filter((item) => item.id !== id));
    this.report('club member delete', this.firebase.deleteClubMember(id));
  }

  private report(action: string, operation: Promise<unknown>): void {
    void operation.catch((error) => console.warn(`Firebase ${action} failed:`, error));
  }
}
