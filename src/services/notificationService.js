/**
 * CarbonChain  -  In-App Notifications Service
 * Per spec §12.
 * Stored in localStorage (`cc_notifications`).
 */

const NOTIFICATIONS_KEY = "cc_notifications";

export function getRawNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read notifications:", err);
    return [];
  }
}

function saveRawNotifications(notifs) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  } catch (err) {
    console.error("Failed to save notifications:", err);
  }
}

/**
 * Returns notifications for the specified user or role
 */
export function getUserNotifications(user) {
  if (!user) return [];
  const all = getRawNotifications();
  const userId = user.id;
  const isVerifier = Boolean(user.isVerifier);

  return all
    .filter((n) => {
      if (isVerifier && (n.recipientRole === "verifier" || n.recipientUserId === "usr_verifier")) {
        return true;
      }
      return n.recipientUserId === userId || (user.walletAddress && n.recipientWallet?.toLowerCase() === user.walletAddress.toLowerCase());
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Returns unread count for user
 */
export function getUnreadNotificationCount(user) {
  const notifs = getUserNotifications(user);
  return notifs.filter((n) => !n.read).length;
}

/**
 * Adds a new notification
 */
export function addNotification({
  recipientUserId,
  recipientRole = null,
  recipientWallet = null,
  type,
  title,
  message,
  link = null,
  metadata = {},
}) {
  const notifs = getRawNotifications();
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    recipientUserId,
    recipientRole,
    recipientWallet,
    type, // e.g. "PROJECT_SUBMITTED", "PROJECT_APPROVED", "CREDITS_SOLD", "CREDITS_RETIRED", "PROJECT_COMPLETED"
    title,
    message,
    link,
    metadata,
    read: false,
    timestamp: new Date().toISOString(),
  };

  notifs.unshift(newNotif);
  saveRawNotifications(notifs);

  // Dispatch custom window event so UI can re-render immediately
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cc_notification_added", { detail: newNotif }));
  }

  return newNotif;
}

/**
 * Marks a notification as read
 */
export function markNotificationAsRead(notifId) {
  const notifs = getRawNotifications();
  const idx = notifs.findIndex((n) => n.id === notifId);
  if (idx !== -1) {
    notifs[idx].read = true;
    saveRawNotifications(notifs);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cc_notification_updated"));
    }
  }
}

/**
 * Marks all notifications for a user as read
 */
export function markAllNotificationsAsRead(user) {
  if (!user) return;
  const all = getRawNotifications();
  const userId = user.id;
  const isVerifier = Boolean(user.isVerifier);

  const updated = all.map((n) => {
    const isForUser =
      (isVerifier && (n.recipientRole === "verifier" || n.recipientUserId === "usr_verifier")) ||
      n.recipientUserId === userId;
    if (isForUser) {
      return { ...n, read: true };
    }
    return n;
  });

  saveRawNotifications(updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cc_notification_updated"));
  }
}
