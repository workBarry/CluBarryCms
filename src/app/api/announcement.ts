import { endpoints } from './endpoints';

export const announcementApi = {
  list: endpoints.announcements,
  create: endpoints.announcements,
  update: (id: number | string) => `${endpoints.announcements}/${id}`,
  delete: (id: number | string) => `${endpoints.announcements}/${id}`,
};
