import { Bell } from "lucide-react";
import { PageEmptyState } from "@/components/PageEmptyState";

export default function NotificationsPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="page-header">Notifications</h1>
        <p className="page-subtitle">0 unread notifications</p>
      </div>

      <PageEmptyState
        icon={Bell}
        title="No notifications"
        description="You are all caught up. Alerts about classes and assignments will appear here later."
      />
    </div>
  );
}
