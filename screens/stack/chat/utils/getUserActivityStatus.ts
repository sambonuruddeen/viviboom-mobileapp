import { DateTime } from 'luxon';

// eslint-disable-next-line import/prefer-default-export
export const getUserActivityStatus = (user) => {
  if (!user) return '';

  if (user.online) {
    return 'Online';
  }

  if (new Date(user.last_active) < new Date()) {
    return `Last seen ${DateTime.fromISO(user.last_active).toRelative()}`;
  }

  return '';
};
