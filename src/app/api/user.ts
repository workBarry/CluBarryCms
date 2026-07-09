import { endpoints } from './endpoints';

export const userApi = {
  list: endpoints.users,
  detail: (id: number | string) => `${endpoints.users}/${id}`,
  create: endpoints.users,
  update: (id: number | string) => `${endpoints.users}/${id}`,
  delete: (id: number | string) => `${endpoints.users}/${id}`,
};
