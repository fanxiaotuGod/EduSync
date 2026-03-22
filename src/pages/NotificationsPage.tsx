import { Bell, Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockNotifications, type Notification } from "@/lib/mock-data";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unread = notifications.filter((n) => !n.read).length;

  const typeIcon: Record<string, string> = {
    info: "bg-info",
    warning: "bg-warning",
    success: "bg-success",
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Notifications</h1>
          <p className="page-subtitle">{unread} unread notifications</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={markAllRead}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
              n.read
                ? "border-border/40 bg-card"
                : "border-primary/20 bg-accent/30"
            }`}
            onClick={() => markRead(n.id)}
          >
            <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${typeIcon[n.type]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{n.title}</p>
                {!n.read && <Badge className="h-4 text-[9px] px-1">New</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{n.date}</p>
            </div>
            {!n.read && (
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => { e.stopPropagation(); markRead(n.id); }}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
