import { createContext, useContext } from 'react';

export const NotificationBadgeContext = createContext({
  unreadCount: 0,
  setUnreadCount: () => {},
  refreshUnreadCount: async () => {},
});

export function useNotificationBadge() {
  return useContext(NotificationBadgeContext);
}
