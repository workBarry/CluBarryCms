import { Injectable, NgZone, signal } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  Firestore, getFirestore,
  collection, doc,
  getDocs, getDoc, addDoc, deleteDoc, setDoc,
  query, where, orderBy, Timestamp, onSnapshot, DocumentReference,
} from 'firebase/firestore';
import {
  Auth, getAuth, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, User as FirebaseUser,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Announcement, ClubSettings, Event, PermissionGroup, PermissionLog, Registration, User } from '../types/admin.models';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly app: FirebaseApp;
  private readonly firestore: Firestore;
  private readonly auth: Auth;
  private readonly zone: NgZone;
  readonly currentFirebaseUser = signal<FirebaseUser | null>(null);

  constructor(zone: NgZone) {
    this.zone = zone;
    this.app = initializeApp(environment.firebase);
    this.firestore = getFirestore(this.app);
    this.auth = getAuth(this.app);

    onAuthStateChanged(this.auth, (user) => {
      zone.run(() => this.currentFirebaseUser.set(user));
    });
  }

  private snapshotObservable<T>(ref: any): Observable<T[]> {
    return new Observable((observer) => {
      const unsub = onSnapshot(ref, (snap: any) => {
        this.zone.run(() => {
          const items: T[] = [];
          snap.forEach((d: any) => items.push({ id: d.id, ...d.data() } as T));
          observer.next(items);
        });
      }, (err: any) => this.zone.run(() => observer.error(err)));
      return { unsubscribe: unsub };
    });
  }

  private docObservable<T>(ref: any): Observable<T | undefined> {
    return new Observable((observer) => {
      const unsub = onSnapshot(ref, (snap: any) => {
        this.zone.run(() => {
          observer.next(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : undefined);
        });
      }, (err: any) => this.zone.run(() => observer.error(err)));
      return { unsubscribe: unsub };
    });
  }

  // --- Auth ---
  login(email: string, password: string): Promise<FirebaseUser> {
    console.log('[FirebaseService] login called', email);
    const p = signInWithEmailAndPassword(this.auth, email, password);
    p.then(
      (cred) => console.log('[FirebaseService] login SUCCESS', cred.user.uid),
      (err) => console.error('[FirebaseService] login FAILED', err.code, err.message),
    );
    return p.then((cred) => cred.user);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  // --- Users ---
  watchUsers(): Observable<User[]> {
    return this.snapshotObservable<User>(collection(this.firestore, 'users'));
  }

  getUser(id: string): Observable<User | undefined> {
    return this.docObservable<User>(doc(this.firestore, `users/${id}`));
  }

  createUser(data: Omit<User, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'users'), { ...data, createdAt: Timestamp.now() });
  }

  setUser(id: string, data: Omit<User, 'id'>): Promise<void> {
    return setDoc(doc(this.firestore, `users/${id}`), { ...data, createdAt: Timestamp.now() });
  }

  updateUser(id: string, data: Partial<User>): Promise<void> {
    return setDoc(doc(this.firestore, `users/${id}`), data, { merge: true });
  }

  deleteUser(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `users/${id}`));
  }

  // --- Events ---
  watchEvents(): Observable<Event[]> {
    const q = query(collection(this.firestore, 'events'), orderBy('createdAt', 'desc'));
    return this.snapshotObservable<Event>(q);
  }

  getEvent(id: string): Observable<Event | undefined> {
    return this.docObservable<Event>(doc(this.firestore, `events/${id}`));
  }

  createEvent(data: Omit<Event, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'events'), { ...data, createdAt: Timestamp.now() });
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

  // --- Registrations ---
  watchRegistrations(): Observable<Registration[]> {
    return this.snapshotObservable<Registration>(collection(this.firestore, 'registrations'));
  }

  watchRegistrationsByEvent(eventId: string): Observable<Registration[]> {
    const q = query(collection(this.firestore, 'registrations'), where('eventId', '==', eventId));
    return this.snapshotObservable<Registration>(q);
  }

  createRegistration(data: Omit<Registration, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'registrations'), { ...data, createdAt: Timestamp.now() });
  }

  updateRegistration(id: string, data: Partial<Registration>): Promise<void> {
    return setDoc(doc(this.firestore, `registrations/${id}`), data, { merge: true });
  }

  // --- Announcements ---
  watchAnnouncements(): Observable<Announcement[]> {
    const q = query(collection(this.firestore, 'announcements'), orderBy('createdAt', 'desc'));
    return this.snapshotObservable<Announcement>(q);
  }

  getAnnouncement(id: string): Observable<Announcement | undefined> {
    return this.docObservable<Announcement>(doc(this.firestore, `announcements/${id}`));
  }

  createAnnouncement(data: Omit<Announcement, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'announcements'), { ...data, createdAt: Timestamp.now() });
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

  // --- Permissions ---
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
    const q = query(collection(this.firestore, 'permissionLogs'), orderBy('createdAt', 'desc'));
    return this.snapshotObservable<PermissionLog>(q);
  }

  addPermissionLog(log: Omit<PermissionLog, 'id'>): Promise<DocumentReference> {
    return addDoc(collection(this.firestore, 'permissionLogs'), log);
  }

  // --- Settings ---
  watchSettings(): Observable<ClubSettings | undefined> {
    return this.docObservable<ClubSettings>(doc(this.firestore, 'settings/club'));
  }

  updateSettings(data: Partial<ClubSettings>): Promise<void> {
    return setDoc(doc(this.firestore, 'settings/club'), data, { merge: true });
  }
}
