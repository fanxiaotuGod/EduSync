import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageEmptyState } from "@/components/PageEmptyState";

export default function AssignmentsPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-header">Assignments</h1>
          <p className="page-subtitle">Create and manage homework for your classes</p>
        </div>
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-4 w-4" /> New Assignment
        </Button>
      </div>

      <PageEmptyState
        icon={FileText}
        title="No assignments yet"
        description="Assignments are not part of the current MVP. This section will stay empty until that feature ships."
      />
    </div>
  );
}
