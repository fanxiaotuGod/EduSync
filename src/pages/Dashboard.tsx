import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  BookOpen,
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  FileText,
  MapPin,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageEmptyState } from "@/components/PageEmptyState";
import { useAuth } from "@/context/AuthContext";
import { listClasses, listSessions, type SessionItem } from "@/lib/api";
import { isTeacherRole, normalizeRole } from "@/lib/roles";

function toMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatTimeLabel(value: string): string {
  return value.slice(0, 5);
}

function compareSessions(a: SessionItem, b: SessionItem): number {
  if (a.date !== b.date) {
    return a.date.localeCompare(b.date);
  }
  return a.start_time.localeCompare(b.start_time);
}

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.name ?? "there";
  const role = normalizeRole(user?.role);
  const isTeacher = isTeacherRole(role);

  const today = new Date();
  const todayKey = toDateKey(today);
  const monthKey = toMonthKey(today);

  const classesQueryKey = ["classes", user?.id, role] as const;
  const sessionsQueryKey = ["sessions", monthKey, user?.id, role] as const;

  const classesQuery = useQuery({
    queryKey: classesQueryKey,
    queryFn: listClasses,
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  const sessionsQuery = useQuery({
    queryKey: sessionsQueryKey,
    queryFn: () => listSessions(monthKey),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  const classes = classesQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];

  const studentCount = useMemo(
    () => classes.reduce((sum, c) => sum + (c.student_count ?? 0), 0),
    [classes],
  );

  const todaysSessions = useMemo(
    () => sessions.filter((s) => s.date === todayKey).sort(compareSessions),
    [sessions, todayKey],
  );

  const upcomingSessions = useMemo(() => {
    return sessions
      .filter((s) => s.date >= todayKey)
      .sort(compareSessions)
      .slice(0, 8);
  }, [sessions, todayKey]);

  const teacherStats = [
    { label: "Students", value: studentCount, icon: Users },
    { label: "Classes", value: classes.length, icon: BookOpen },
    { label: "Today's sessions", value: todaysSessions.length, icon: CalendarIcon },
    { label: "Pending assignments", value: 0, icon: FileText },
  ];

  const studentStats = [
    { label: "Classes joined", value: classes.length, icon: BookOpen },
    { label: "Today's sessions", value: todaysSessions.length, icon: CalendarIcon },
    {
      label: "Upcoming sessions",
      value: upcomingSessions.length,
      icon: CalendarDays,
    },
  ];

  const stats = isTeacher ? teacherStats : studentStats;

  const isLoading = classesQuery.isLoading || sessionsQuery.isLoading;
  const loadError =
    (classesQuery.error as Error | null)?.message ??
    (sessionsQuery.error as Error | null)?.message ??
    null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {displayName}.</p>
      </div>

      <div
        className={`grid gap-4 ${
          isTeacher ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <stat.icon className="mb-3 h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold tracking-tight">
                {isLoading ? "—" : stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">
            {isTeacher ? "Upcoming schedule" : "Your upcoming sessions"}
          </CardTitle>
          <Link
            to="/calendar"
            className="text-xs font-medium text-primary hover:underline shrink-0"
          >
            View calendar
          </Link>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="text-sm text-destructive" role="alert">
              {loadError}
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading schedule…</p>
          ) : upcomingSessions.length === 0 ? (
            <PageEmptyState
              icon={CalendarIcon}
              title={isTeacher ? "No upcoming sessions" : "No sessions scheduled"}
              description={
                isTeacher
                  ? "Create sessions on the Calendar page once you have classes."
                  : "Sessions for your joined classes will appear here and on the Calendar."
              }
            />
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-border/60 p-4 shadow-sm"
                  style={{ borderLeftWidth: 4, borderLeftColor: session.color }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{session.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {session.class_name}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(session.date), "EEE, MMM d")}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {formatTimeLabel(session.start_time)} –{" "}
                      {formatTimeLabel(session.end_time)}
                    </span>
                    {session.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {session.location}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
