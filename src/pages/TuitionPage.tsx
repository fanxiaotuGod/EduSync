import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageEmptyState } from "@/components/PageEmptyState";

export default function TuitionPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-header">Tuition</h1>
          <p className="page-subtitle">Track student balances and payment records</p>
        </div>
        <Button size="sm" className="gap-1.5" disabled>
          <DollarSign className="h-4 w-4" /> Record Top-up
        </Button>
      </div>

      <PageEmptyState
        icon={DollarSign}
        title="No tuition records yet"
        description="Tuition and balance tracking is planned for a later release and is not included in the current MVP."
      />
    </div>
  );
}
