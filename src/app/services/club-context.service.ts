import { Injectable, computed, inject, signal } from '@angular/core';
import { ClubDataService } from './club-data.service';

@Injectable({ providedIn: 'root' })
export class ClubContextService {
  private readonly clubData = inject(ClubDataService);
  readonly selectedClubId = signal<string>('');
  readonly selectedClub = computed(() => (
    this.clubData.clubs().find((club) => club.id === this.selectedClubId())
  ));
  readonly membersOfSelectedClub = computed(() => {
    const clubId = this.selectedClubId();
    return this.clubData.clubMembers().filter((member) => member.clubId === clubId);
  });

  selectClub(id: string): void {
    this.selectedClubId.set(id);
  }
}
