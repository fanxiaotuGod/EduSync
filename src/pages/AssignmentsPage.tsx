import { useState } from "react";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockAssignments, mockClasses } from "@/lib/mock-data";

export default function AssignmentsPage() {
  const [classFilter, setClassFilter] = useState("all");

  const filtered = classFilter === "all"
    ? mockAssignments
    : mockAssignments.filter((a) => a.classId === classFilter);

  const statusStyle: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    submitted: "bg-info/10 text-info border-info/20",
    graded: "bg-success/10 text-success border-success/20",
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Assignments</h1>
          <p className="page-subtitle">Create and manage homework for your classes</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> New Assignment
        </Button>
      </div>

      <Select value={classFilter} onValueChange={setClassFilter}>
        <SelectTrigger className="h-9 w-[180px] text-xs">
          <Filter className="w-3.5 h-3.5 mr-1" />
          <SelectValue placeholder="All Classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Classes</SelectItem>
          {mockClasses.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((a) => (
          <Card key={a.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">{a.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.className}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusStyle[a.status]}`}>
                  {a.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">{a.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Due: {a.dueDate}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(a.submittedCount / a.totalCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{a.submittedCount}/{a.totalCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
