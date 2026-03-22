import { motion } from "framer-motion";
import { Users, BookOpen, Calendar as CalendarIcon, FileText, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { mockClasses, mockSessions, mockAssignments, mockStudents, mockNotifications, studentBalances } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Total Students", value: mockStudents.length, icon: Users, color: "text-primary" },
  { label: "Active Classes", value: mockClasses.filter(c => c.teacherId === "t1").length, icon: BookOpen, color: "text-info" },
  { label: "Today's Sessions", value: mockSessions.filter(s => s.date === new Date().toISOString().split("T")[0]).length, icon: CalendarIcon, color: "text-warning" },
  { label: "Pending Assignments", value: mockAssignments.filter(a => a.status === "pending").length, icon: FileText, color: "text-destructive" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

export default function Dashboard() {
  const todaySessions = mockSessions.filter(
    (s) => s.date === new Date().toISOString().split("T")[0]
  );
  const lowBalanceStudents = studentBalances.filter((s) => s.status !== "sufficient");

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subtitle">Welcome back, 李明. Here's your overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <TrendingUp className="w-3.5 h-3.5 text-success" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No sessions today</p>
            ) : (
              todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors"
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground">{session.className}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">{session.startTime} - {session.endTime}</p>
                    <p className="text-xs text-muted-foreground">{session.location}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowBalanceStudents.map((s) => (
              <div key={s.studentId} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.studentName}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.className}</p>
                </div>
                <Badge variant={s.status === "zero" ? "destructive" : "outline"} className="text-[10px] flex-shrink-0">
                  {s.balance} {s.unit}
                </Badge>
              </div>
            ))}

            {mockNotifications.filter(n => !n.read).map((n) => (
              <div key={n.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/40">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  n.type === "warning" ? "bg-warning" : n.type === "success" ? "bg-success" : "bg-info"
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Recent Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {mockAssignments.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-[10px]">{a.className}</Badge>
                  <Badge variant={a.status === "graded" ? "default" : a.status === "submitted" ? "outline" : "secondary"} className="text-[10px]">
                    {a.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Due: {a.dueDate}</p>
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(a.submittedCount / a.totalCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{a.submittedCount}/{a.totalCount}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
