import { Injectable, inject } from '@angular/core';
import { AdminConfigService } from './admin-config.service';
import { ClubDataService } from './club-data.service';
import { EventDataService } from './event-data.service';
import { UserDataService } from './user-data.service';

@Injectable({ providedIn: 'root' })
export class AdminSyncService {
  private readonly users = inject(UserDataService);
  private readonly events = inject(EventDataService);
  private readonly clubs = inject(ClubDataService);
  private readonly config = inject(AdminConfigService);

  start(): void {
    this.users.startSync();
    this.events.startSync();
    this.clubs.startSync();
    this.config.startSync();
  }

  stop(): void {
    this.users.stopSync();
    this.events.stopSync();
    this.clubs.stopSync();
    this.config.stopSync();
  }
}
