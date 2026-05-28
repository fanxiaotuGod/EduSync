import { BookOpen, Calendar as CalendarIcon, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageEmptyState } from "@/components/PageEmptyState";
import { useAuth } from "@/context/AuthContext";

const stats = [
  { label: "Students", value: 0, icon: Users },
  { label: "Classes", value: 0, icon: BookOpen },
  { label: "Today's sessions", value: 0, icon: CalendarIcon },
  { label: "Pending assignments", value: 0, icon: FileText },
];

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.name ?? "there";

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {displayName}.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <stat.icon className="mb-3 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Getting started</CardTitle>
        </CardHeader>
        <CardContent>
          <PageEmptyState
            icon={BookOpen}
            title="No data yet"
            description="Your classes, schedule, and assignments will appear here once you add them in a future update."
          />
        </CardContent>
      </Card>
    </div>
  );
}
