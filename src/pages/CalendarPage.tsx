import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockSessions, mockClasses } from "@/lib/mock-data";

type ViewMode = "month" | "week";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const days: { date: Date; currentMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevDays - i), currentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), currentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), currentMonth: false });
  }
  return days;
}

function getWeekDays(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const fmt = (d: Date) => d.toISOString().split("T")[0];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [classFilter, setClassFilter] = useState<string>("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = fmt(new Date());

  const filteredSessions = useMemo(() => {
    if (classFilter === "all") return mockSessions;
    return mockSessions.filter((s) => s.classId === classFilter);
  }, [classFilter]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const monthDays = getMonthDays(year, month);
  const weekDays = getWeekDays(currentDate);

  const sessionsForDate = (dateStr: string) =>
    filteredSessions.filter((s) => s.date === dateStr);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Calendar</h1>
          <p className="page-subtitle">Manage your course schedule</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> New Session
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {view === "month"
              ? `${MONTHS[month]} ${year}`
              : `Week of ${weekDays[0].toLocaleDateString()}`}
          </h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="ml-2 text-xs h-7" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {mockClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex bg-secondary rounded-lg p-0.5">
            <Button variant={view === "month" ? "default" : "ghost"} size="sm" className="h-7 text-xs px-3" onClick={() => setView("month")}>Month</Button>
            <Button variant={view === "week" ? "default" : "ghost"} size="sm" className="h-7 text-xs px-3" onClick={() => setView("week")}>Week</Button>
          </div>
        </div>
      </div>

      {/* Month View */}
      {view === "month" && (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="grid grid-cols-7">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-3 bg-secondary/30 border-b border-border">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map(({ date, currentMonth }, i) => {
              const dateStr = fmt(date);
              const isToday = dateStr === today;
              const sessions = sessionsForDate(dateStr);
              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-border p-1.5 transition-colors hover:bg-secondary/20 ${
                    !currentMonth ? "bg-muted/30" : ""
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-primary text-primary-foreground" : currentMonth ? "text-foreground" : "text-muted-foreground/50"
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {sessions.slice(0, 2).map((s) => (
                      <div
                        key={s.id}
                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: s.color + "20", color: s.color, borderLeft: `2px solid ${s.color}` }}
                      >
                        {s.startTime} {s.title}
                      </div>
                    ))}
                    {sessions.length > 2 && (
                      <p className="text-[10px] text-muted-foreground pl-1.5">+{sessions.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="grid grid-cols-7">
            {weekDays.map((d) => {
              const dateStr = fmt(d);
              const isToday = dateStr === today;
              return (
                <div key={dateStr} className={`text-center py-3 border-b border-border ${isToday ? "bg-accent" : "bg-secondary/30"}`}>
                  <p className="text-xs text-muted-foreground">{DAYS[d.getDay()]}</p>
                  <p className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((d) => {
              const dateStr = fmt(d);
              const sessions = sessionsForDate(dateStr);
              return (
                <div key={dateStr} className="border-r border-border p-2 space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-2 rounded-lg text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: s.color + "15", borderLeft: `3px solid ${s.color}` }}
                    >
                      <p className="font-medium" style={{ color: s.color }}>{s.startTime}-{s.endTime}</p>
                      <p className="font-medium mt-0.5 text-foreground">{s.title}</p>
                      <p className="text-muted-foreground mt-0.5">{s.location}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
