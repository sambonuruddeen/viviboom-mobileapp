/* eslint-disable no-use-before-define */
import { useCallback } from 'react';
import { useEffect } from 'react';

import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { navigationRef } from 'rn-viviboom/navigation/RootNavigator';
import NotificationReduxActions from 'rn-viviboom/redux/notification/NotificationReduxActions';

const checkingIntervalInMs = 10 * 60 * 1000; // 10 mins
const pollIntervalInMs = 60 * 1000; // 1 min

let prevCompleteCheckTime: number;
let pollingTimeout: NodeJS.Timeout;

export default function PresentNotificationService() {
  const authToken = useReduxStateSelector((state) => state.account?.authToken);
  const notificationsUnpresented = useReduxStateSelector((state) => state?.notification?.unpresented);

  const pollForNewNotifications = useCallback(async () => {
    pollingTimeout = setTimeout(pollForNewNotifications, pollIntervalInMs);

    if (!authToken) {
      return;
    }

    if (prevCompleteCheckTime) {
      const diff = Math.abs(Date.now() - prevCompleteCheckTime);
      if (diff < checkingIntervalInMs) {
        return;
      }
    }
    await NotificationReduxActions.fetch();
    prevCompleteCheckTime = Date.now();
  }, [authToken]);

  // For refetching notifications
  useEffect(() => {
    pollForNewNotifications();
    return () => {
      if (pollingTimeout) clearTimeout(pollingTimeout);
    };
  }, [pollForNewNotifications]);

  // For Confetti popup
  useEffect(() => {
    if (!notificationsUnpresented?.length || !navigationRef.isReady()) return;
    navigationRef.navigate('PresentNotificationScreen');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsUnpresented, navigationRef.isReady()]);

  return null;
}
