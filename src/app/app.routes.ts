import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './services/auth.guard';
import { AdminLoginPage } from './pages/admin/admin-login.page';
import { AnnouncementsAdminPage } from './pages/admin/announcements-admin.page';
import { DashboardPage } from './pages/admin/dashboard.page';
import { EventsAdminPage } from './pages/admin/events-admin.page';
import { OfficersAdminPage } from './pages/admin/officers-admin.page';
import { PermissionsAdminPage } from './pages/admin/permissions-admin.page';
import { RegistrationsAdminPage } from './pages/admin/registrations-admin.page';
import { SettingsAdminPage } from './pages/admin/settings-admin.page';
import { UsersAdminPage } from './pages/admin/users-admin.page';

export const routes: Routes = [
  { path: 'login', component: AdminLoginPage, title: 'Club MS - 後台登入' },
  { path: 'dashboard', component: DashboardPage, title: 'Club MS - Dashboard', canActivate: [authGuard] },
  { path: 'users', component: UsersAdminPage, title: 'Club MS - 社員管理', canActivate: [authGuard] },
  { path: 'events', component: EventsAdminPage, title: 'Club MS - 活動管理', canActivate: [authGuard] },
  { path: 'announcements', component: AnnouncementsAdminPage, title: 'Club MS - 公告管理', canActivate: [authGuard] },
  { path: 'registrations', component: RegistrationsAdminPage, title: 'Club MS - 報名管理', canActivate: [authGuard] },
  { path: 'officers', component: OfficersAdminPage, title: 'Club MS - 幹部管理', canActivate: [authGuard] },
  { path: 'permissions', component: PermissionsAdminPage, title: 'Club MS - 權限管理', canActivate: [adminGuard] },
  { path: 'settings', component: SettingsAdminPage, title: 'Club MS - 系統設定', canActivate: [adminGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
