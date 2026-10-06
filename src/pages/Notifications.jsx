import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Layers,
  Leaf,
  ShoppingBag,
  Clock,
  ArrowRight,
  Check,
  SendHorizonal,
  Lock,
  RotateCcw
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../services/notificationService";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'

  const loadNotifs = () => {
    if (!user) return;
    const notifs = getUserNotifications(user);
    setNotifications(notifs);
  };

  useEffect(() => {
    document.title = "Notifications | CarbonChain";
    loadNotifs();

    const handleUpdate = () => loadNotifs();
    window.addEventListener("cc_notification_added", handleUpdate);
    window.addEventListener("cc_notification_updated", handleUpdate);
    return () => {
      window.removeEventListener("cc_notification_added", handleUpdate);
      window.removeEventListener("cc_notification_updated", handleUpdate);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-stone-900 mb-3">Please sign in</h1>
        <Link to="/login" className="btn-outline text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(user);
    loadNotifs();
  };

  const handleMarkRead = (id) => {
    markNotificationAsRead(id);
    loadNotifs();
  };

  const getIconForType = (type) => {
    switch (type) {
      case "PROJECT_CONCLUDED":
      case "PROJECT_COMPLETED":
        return <Lock className="w-4 h-4 text-stone-600" />;
      case "CREDITS_SOLD":
      case "PURCHASE_SUCCESSFUL":
        return <ShoppingBag className="w-4 h-4 text-emerald-700" />;
      case "CREDITS_RETIRED":
      case "RETIREMENT_APPROVED":
      case "RETIREMENT_REQUESTED":
        return <Leaf className="w-4 h-4 text-emerald-700" />;
      case "PROJECT_SUBMITTED":
        return <SendHorizonal className="w-4 h-4 text-[#14532D]" />;
      default:
        return <Bell className="w-4 h-4 text-[#14532D]" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#14532D] block mb-1">
            Activity Stream
          </span>
          <h1 className="text-2xl font-semibold text-stone-900">Notifications</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Audit logs and transactional updates regarding your projects, purchases, and retirement authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="btn-neutral-outline text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
            filter === "all"
              ? "bg-[#14532D] text-white"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
            filter === "unread"
              ? "bg-[#14532D] text-white"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="clean-card p-12 text-center bg-white border border-stone-200 rounded-lg">
          <Bell className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-900 mb-1">No notifications</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {filter === "unread"
              ? "All notifications have been marked as read."
              : "You have no activity notifications at this time."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`clean-card p-4 rounded-lg border transition-all flex items-start gap-3.5 ${
                item.read
                  ? "bg-white border-stone-200"
                  : "bg-emerald-50/20 border-emerald-300 shadow-2xs"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                {getIconForType(item.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-stone-900 leading-tight">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-stone-400 font-mono whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed">
                  {item.message}
                </p>

                <div className="pt-1.5 flex items-center gap-3 text-xs">
                  {item.link && (
                    <Link
                      to={item.link}
                      onClick={() => !item.read && handleMarkRead(item.id)}
                      className="text-[#14532D] hover:underline font-semibold inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id)}
                      className="text-stone-400 hover:text-stone-700 text-[11px] cursor-pointer"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
