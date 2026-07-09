import { endpoints } from './endpoints';

export const authApi = {
  login: endpoints.auth.login,
  logout: endpoints.auth.logout,
  register: endpoints.auth.register,
  me: endpoints.auth.me,
};
