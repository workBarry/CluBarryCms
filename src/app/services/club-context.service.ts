import { Injectable, inject, signal } from '@angular/core';
import { AdminDataService } from './admin-data.service';

@Injectable({ providedIn: 'root' })
export class ClubContextService {
  private readonly data = inject(AdminDataService);
  readonly selectedClubId = signal<string>('');

  readonly clubs = this.data.clubs;
  readonly clubMembers = this.data.clubMembers;

  get selectedClub() {
    return this.data.clubs().find((c) => c.id === this.selectedClubId());
  }

  selectClub(id: string): void {
    this.selectedClubId.set(id);
  }

  membersOfSelectedClub() {
    const clubId = this.selectedClubId();
    return this.data.clubMembers().filter((m) => m.clubId === clubId);
  }
}
