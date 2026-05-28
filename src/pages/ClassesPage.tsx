import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageEmptyState } from "@/components/PageEmptyState";

export default function ClassesPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-header">Classes</h1>
          <p className="page-subtitle">Manage your classes and student groups</p>
        </div>
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="h-4 w-4" /> Create Class
        </Button>
      </div>

      <PageEmptyState
        icon={BookOpen}
        title="No classes yet"
        description="You have not created any classes. Class management will be available in the next MVP milestone."
      />
    </div>
  );
}
