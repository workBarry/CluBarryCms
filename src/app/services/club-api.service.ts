import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Club, ClubMember } from '../types/admin.models';

@Injectable({ providedIn: 'root' })
export class ClubApiService {
  private readonly firebase = inject(FirebaseService);

  async createClub(club: Omit<Club, 'id'>, presidentId: string): Promise<{ clubId: string; memberId: string }> {
    const clubRef = await this.firebase.createClub(club);
    const clubId = clubRef.id;

    const member: Omit<ClubMember, 'id'> = {
      userId: presidentId,
      clubId,
      roleInClub: 'President',
      status: 'active',
      joinedAt: new Date().toISOString(),
    };
    const memberRef = await this.firebase.createClubMember(member);

    return { clubId, memberId: memberRef.id };
  }

  async getMyClubs(userId: string): Promise<{ club: Club; role: ClubMember['roleInClub'] }[]> {
    const memberSnaps = await this.firebase.watchClubMembersByUser(userId).toPromise();
    const myMembers = memberSnaps?.filter(m => m.status === 'active') ?? [];

    const clubs = await Promise.all(
      myMembers.map(async (member) => {
        const club = await this.firebase.getClub(member.clubId).toPromise();
        return { club: club!, role: member.roleInClub };
      })
    );

    return clubs.filter(c => c.club.status === 'active');
  }

  async getMyRoleInClub(userId: string, clubId: string): Promise<ClubMember['roleInClub'] | null> {
    const members = await this.firebase.watchClubMembers(clubId).toPromise();
    const myMember = members?.find(m => m.userId === userId && m.status === 'active');
    return myMember?.roleInClub ?? null;
  }

  async updateClubStatus(clubId: string, status: Club['status']): Promise<void> {
    await this.firebase.updateClub(clubId, { status });
  }
}