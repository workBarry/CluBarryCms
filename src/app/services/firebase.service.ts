import { Injectable, NgZone, signal } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  DocumentData,
  DocumentReference,
  Firestore,
  Query,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  Auth,
  User as FirebaseUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Announcement,
  Club,
  ClubMember,
  ClubSettings,
  Event,
  PermissionGroup,
  PermissionLog,
  Registration,
  Session,
  User,
} from '../types/admin.models';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly app: FirebaseApp;
  private readonly firestore: Firestore;
  private readonly auth: Auth;
  readonly currentFirebaseUser = signal<FirebaseUser | null>(null);
  readonly authReady = signal(false);

  constructor(private readonly zone: NgZone) {
    this.app = initializeApp(environment.firebase);
    this.firestore = getFirestore(this.app);
    this.auth = getAuth(this.app);

    onAuthStateChanged(this.auth, (user) => {
      this.zone.run(() => {
        this.currentFirebaseUser.set(user);
        this.authReady.set(true);
      });
    });
  }

  private snapshotObservable<T>(ref: Query<DocumentData>): Observable<T[]> {
    return new Observable((observer) => {
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          const items = snapshot.docs.map((item) => ({
            id: item.id,
            ...(this.normalizeValue(item.data()) as Record<string, unknown>),
          } as T));
          this.zone.run(() => observer.next(items));
        },
        (error) => this.zone.run(() => observer.error(error)),
      );
      return unsubscribe;
    });
  }

  private docObservable<T>(ref: DocumentReference<DocumentData>): Observable<T | undefined> {
    return new Observable((observer) => {
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          const value = snapshot.exists()
            ? ({
                id: snapshot.id,
                ...(this.normalizeValue(snapshot.data()) as Record<string, unknown>),
              } as T)
            : undefined;
          this.zone.run(() => observer.next(value));
        },
        (error) => this.zone.run(() => observer.error(error)),
      );
      return unsubscribe;
    });
  }

  private normalizeValue(value: unknown): unknown {
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map((item) => this.normalizeValue(item));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, this.normalizeValue(item)]),
      );
    }
    return value;
  }

  login(email: string, password: string): Promise<FirebaseUser> {
    return signInWithEmailAndPassword(this.auth, email, password).then((credential) => credential.user);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  watchUsers(): Observable<User[]> {
    return this.snapshotObservable<User>(collection(this.firestore, 'users'));
  }

  getUser(id: string): Observable<User | undefined> {
    return this.docObservable<User>(doc(this.firestore, `users/${id}`));
  }

  updateUser(id: string, data: Partial<User>): Promise<void> {
    return setDoc(doc(this.firestore, `users/${id}`), data, { merge: true });
  }

  deleteUser(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `users/${id}`));
  }

  watchEvents(): Observable<Event[]> {
    return this.snapshotObservable<Event>(
      query(collection(this.firestore, 'events'), orderBy('createdAt', 'desc')),
    );
  }

  setEvent(id: string, data: Omit<Event, 'id'>): Promise<void> {
    return setDoc(doc(this.firestore, `events/${id}`), { ...data, createdAt: Timestamp.now() });
  }

  updateEvent(id: string, data: Partial<Event>): Promise<void> {
    return setDoc(doc(this.firestore, `events/${id}`), data, { merge: true });
  }

  deleteEvent(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `events/${id}`));
  }

  getSessionsByEvent(eventId: string): Promise<DocumentData[]> {
    return getDocs(query(collection(this.firestore, 'sessions'), where('eventId', '==', eventId)))
      .then((snap) => snap.docs);
  }

  getRegistrationsByEvent(eventId: string): Promise<DocumentData[]> {
    return getDocs(query(collection(this.firestore, 'registrations'), where('eventId', '==', eventId)))
      .then((snap) => snap.docs);
  }

  deleteSessionsByEvent(eventId: string): Promise<void> {
    return this.getSessionsByEvent(eventId).then((docs) =>
      Promise.all(docs.map((d) => deleteDoc(d.ref))),
    ).then(() => undefined);
  }

  deleteRegistrationsByEvent(eventId: string): Promise<void> {
    return this.getRegistrationsByEvent(eventId).then((docs) =>
      Promise.all(docs.map((d) => deleteDoc(d.ref))),
    ).then(() => undefined);
  }

  watchRegistrations(): Observable<Registration[]> {
    return this.snapshotObservable<Registration>(collection(this.firestore, 'registrations'));
  }

  updateRegistration(id: string, data: Partial<Registration>): Promise<void> {
    return setDoc(doc(this.firestore, `registrations/${id}`), data, { merge: true });
  }

  watchAnnouncements(): Observable<Announcement[]> {
    return this.snapshotObservable<Announcement>(
      query(collection(this.firestore, 'announcements'), orderBy('createdAt', 'desc')),
    );
  }

  setAnnouncement(id: string, data: Omit<Announcement, 'id'>): Promise<void> {
    return setDoc(doc(this.firestore, `announcements/${id}`), { ...data, createdAt: Timestamp.now() });
  }

  updateAnnouncement(id: string, data: Partial<Announcement>): Promise<void> {
    return setDoc(doc(this.firestore, `announcements/${id}`), data, { merge: true });
  }

  deleteAnnouncement(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `announcements/${id}`));
  }

  watchClubs(): Observable<Club[]> {
    return this.snapshotObservable<Club>(
      query(collection(this.firestore, 'clubs'), orderBy('createdAt', 'desc')),
    );
  }

  createClub(data: Omit<Club, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'clubs'), { ...data, createdAt: Timestamp.now() });
  }

  updateClub(id: string, data: Partial<Club>): Promise<void> {
    return setDoc(doc(this.firestore, `clubs/${id}`), data, { merge: true });
  }

  deleteClub(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `clubs/${id}`));
  }

  watchAllClubMembers(): Observable<ClubMember[]> {
    return this.snapshotObservable<ClubMember>(collection(this.firestore, 'clubMembers'));
  }

  createClubMember(data: Omit<ClubMember, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'clubMembers'), { ...data, joinedAt: Timestamp.now() });
  }

  updateClubMember(id: string, data: Partial<ClubMember>): Promise<void> {
    return setDoc(doc(this.firestore, `clubMembers/${id}`), data, { merge: true });
  }

  deleteClubMember(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `clubMembers/${id}`));
  }

  watchSessions(): Observable<Session[]> {
    return this.snapshotObservable<Session>(collection(this.firestore, 'sessions'));
  }

  createSession(data: Omit<Session, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'sessions'), { ...data, createdAt: Timestamp.now() });
  }

  updateSession(id: string, data: Partial<Session>): Promise<void> {
    return setDoc(doc(this.firestore, `sessions/${id}`), data, { merge: true });
  }

  deleteSession(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `sessions/${id}`));
  }

  watchPermissions(): Observable<PermissionGroup[]> {
    return this.snapshotObservable<PermissionGroup>(collection(this.firestore, 'permissions'));
  }

  updatePermission(id: string, data: Partial<PermissionGroup>): Promise<void> {
    return setDoc(doc(this.firestore, `permissions/${id}`), data, { merge: true });
  }

  createPermission(group: PermissionGroup): Promise<void> {
    return setDoc(doc(this.firestore, `permissions/${group.role}`), group);
  }

  watchPermissionLogs(): Observable<PermissionLog[]> {
    return this.snapshotObservable<PermissionLog>(
      query(collection(this.firestore, 'permissionLogs'), orderBy('createdAt', 'desc')),
    );
  }

  addPermissionLog(log: Omit<PermissionLog, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'permissionLogs'), log);
  }

  watchSettings(): Observable<ClubSettings | undefined> {
    return this.docObservable<ClubSettings>(doc(this.firestore, 'settings/club'));
  }

  updateSettings(data: Partial<ClubSettings>): Promise<void> {
    return setDoc(doc(this.firestore, 'settings/club'), data, { merge: true });
  }
}
