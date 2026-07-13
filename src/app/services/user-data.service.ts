import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '../types/admin.models';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private readonly firebase = inject(FirebaseService);
  private subscription?: Subscription;

  readonly users = signal<User[]>([]);

  startSync(): void {
    if (this.subscription && !this.subscription.closed) return;
    this.subscription = this.firebase.watchUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (error) => console.warn('Firebase users sync failed:', error),
    });
  }

  stopSync(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.users.set([]);
  }

  findUser(id: string): User | undefined {
    return this.users().find((user) => user.id === id);
  }

  updateUser(user: User): void {
    if (!user.id) return;
    this.users.update((items) => items.map((item) => (item.id === user.id ? user : item)));
    void this.firebase.updateUser(user.id, user).catch((error) => {
      console.warn('Firebase user update failed:', error);
    });
  }

  deleteUser(id: string): void {
    this.users.update((items) => items.filter((item) => item.id !== id));
    void this.firebase.deleteUser(id).catch((error) => {
      console.warn('Firebase user delete failed:', error);
    });
  }
}
