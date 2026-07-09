import { endpoints } from './endpoints';

export const eventApi = {
  list: endpoints.events,
  detail: (id: number | string) => `${endpoints.events}/${id}`,
  create: endpoints.events,
  update: (id: number | string) => `${endpoints.events}/${id}`,
  delete: (id: number | string) => `${endpoints.events}/${id}`,
};
