import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageEmptyState } from "@/components/PageEmptyState";

export default function CalendarPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-header">Calendar</h1>
          <p className="page-subtitle">View and manage your class schedule</p>
        </div>
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-4 w-4" /> Add Session
        </Button>
      </div>

      <PageEmptyState
        icon={Calendar}
        title="No sessions scheduled"
        description="Your calendar is empty. Scheduled classes will appear here once scheduling is enabled."
      />
    </div>
  );
}
