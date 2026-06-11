import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageEmptyState } from "@/components/PageEmptyState";

export default function StudentsPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-header">Students</h1>
          <p className="page-subtitle">0 students enrolled</p>
        </div>
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>

      <PageEmptyState
        icon={Users}
        title="No students yet"
        description="Students will show up here after you create classes and enroll them."
      />
    </div>
  );
}
