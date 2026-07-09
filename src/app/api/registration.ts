import { endpoints } from './endpoints';

export const registrationApi = {
  list: endpoints.registrations,
  create: endpoints.registrations,
  update: (id: number | string) => `${endpoints.registrations}/${id}`,
  delete: (id: number | string) => `${endpoints.registrations}/${id}`,
};
