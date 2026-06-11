import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageEmptyState } from "@/components/PageEmptyState";
import { useAuth } from "@/context/AuthContext";
import {
  createSession,
  deleteSession,
  listClasses,
  listSessions,
  updateSession,
  type SessionItem,
} from "@/lib/api";
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

function toTimeInputValue(value: string): string {
  return value.slice(0, 5);
}

export default function CalendarPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isTeacher = isTeacherRole(role);

  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(toDateKey(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSessionDate, setEditSessionDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("10:00");
  const [editLocation, setEditLocation] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<SessionItem | null>(null);

  const queryClient = useQueryClient();

  const monthKey = toMonthKey(calendarMonth);
  const classesQueryKey = ["classes", user?.id, role] as const;
  const sessionsQueryKey = ["sessions", monthKey, user?.id, role] as const;

  const classesQuery = useQuery({
    queryKey: classesQueryKey,
    queryFn: listClasses,
    enabled: Boolean(user?.id) && isTeacher,
  });

  const sessionsQuery = useQuery({
    queryKey: sessionsQueryKey,
    queryFn: () => listSessions(monthKey),
    enabled: Boolean(user?.id),
  });

  const createMutation = useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setCreateOpen(false);
      setTitle("");
      setLocation("");
      toast.success("Session created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      sessionId,
      input,
    }: {
      sessionId: string;
      input: {
        title: string;
        date: string;
        start_time: string;
        end_time: string;
        location?: string;
      };
    }) => updateSession(sessionId, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setEditOpen(false);
      setEditingSession(null);
      if (updated.date !== toDateKey(selectedDate)) {
        const [year, month, day] = updated.date.split("-").map(Number);
        setSelectedDate(new Date(year, month - 1, day));
        setCalendarMonth(new Date(year, month - 1, 1));
      }
      toast.success("Session updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setDeleteTarget(null);
      toast.success("Session deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const sessions = sessionsQuery.data ?? [];
  const selectedDateKey = toDateKey(selectedDate);

  const sessionsOnSelectedDay = useMemo(
    () => sessions.filter((session) => session.date === selectedDateKey),
    [sessions, selectedDateKey],
  );

  const daysWithSessions = useMemo(() => {
    const uniqueDates = [...new Set(sessions.map((session) => session.date))];
    return uniqueDates.map((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    });
  }, [sessions]);

  const teacherClasses = classesQuery.data ?? [];

  function openCreateDialog() {
    setSessionDate(selectedDateKey);
    if (!classId && teacherClasses.length > 0) {
      setClassId(teacherClasses[0].id);
    }
    setCreateOpen(true);
  }

  function openEditDialog(session: SessionItem) {
    setEditingSession(session);
    setEditTitle(session.title);
    setEditSessionDate(session.date);
    setEditStartTime(toTimeInputValue(session.start_time));
    setEditEndTime(toTimeInputValue(session.end_time));
    setEditLocation(session.location ?? "");
    setEditOpen(true);
  }

  function handleCreateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!classId) {
      toast.error("Please select a class");
      return;
    }
    createMutation.mutate({
      class_id: classId,
      title: title.trim(),
      date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      location: location.trim() || undefined,
    });
  }

  function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingSession) {
      return;
    }
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      toast.error("Title is required");
      return;
    }
    updateMutation.mutate({
      sessionId: editingSession.id,
      input: {
        title: trimmedTitle,
        date: editSessionDate,
        start_time: editStartTime,
        end_time: editEndTime,
        location: editLocation.trim() || undefined,
      },
    });
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-header">Calendar</h1>
          <p className="page-subtitle">
            {isTeacher
              ? "Pick a day, add sessions, and manage your schedule"
              : "View sessions for classes you have joined"}
          </p>
        </div>
        {isTeacher ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={openCreateDialog}
                disabled={teacherClasses.length === 0}
              >
                <Plus className="h-4 w-4" /> Add Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle>New session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label>Class</Label>
                    <Select
                      value={classId}
                      onValueChange={setClassId}
                      disabled={createMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherClasses.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="session-title">Title</Label>
                    <Input
                      id="session-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Algebra review"
                      required
                      disabled={createMutation.isPending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="session-date">Date</Label>
                    <Input
                      id="session-date"
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      required
                      disabled={createMutation.isPending}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="start-time">Start</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        disabled={createMutation.isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="end-time">End</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        disabled={createMutation.isPending}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="session-location">Location</Label>
                    <Input
                      id="session-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Room 201"
                      disabled={createMutation.isPending}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving…" : "Save session"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {isTeacher && teacherClasses.length === 0 && !classesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Create a class first on the Classes page before scheduling sessions.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[auto,1fr]">
        <Card className="border-border/60 shadow-sm w-fit">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              modifiers={{ hasSession: daysWithSessions }}
              modifiersClassNames={{
                hasSession:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {format(selectedDate, "EEEE, MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading sessions…</p>
            ) : sessionsQuery.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {(sessionsQuery.error as Error).message}
              </p>
            ) : sessionsOnSelectedDay.length === 0 ? (
              <PageEmptyState
                icon={CalendarIcon}
                title="No sessions on this day"
                description={
                  isTeacher
                    ? "Select another day or add a new session."
                    : "No classes are scheduled for this day."
                }
              />
            ) : (
              sessionsOnSelectedDay.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-border/60 p-4 shadow-sm"
                  style={{ borderLeftWidth: 4, borderLeftColor: session.color }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{session.title}</p>
                    {isTeacher ? (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Edit ${session.title}`}
                          onClick={() => openEditDialog(session)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Delete ${session.title}`}
                          onClick={() => setDeleteTarget(session)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {session.class_name}
                  </p>
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
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {isTeacher ? (
        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) {
              setEditingSession(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {editingSession ? (
                  <p className="text-sm text-muted-foreground">
                    Class: <span className="font-medium">{editingSession.class_name}</span>
                  </p>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-session-title">Title</Label>
                  <Input
                    id="edit-session-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-session-date">Date</Label>
                  <Input
                    id="edit-session-date"
                    type="date"
                    value={editSessionDate}
                    onChange={(e) => setEditSessionDate(e.target.value)}
                    required
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-start-time">Start</Label>
                    <Input
                      id="edit-start-time"
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      required
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-end-time">End</Label>
                    <Input
                      id="edit-end-time"
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      required
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-session-location">Location</Label>
                  <Input
                    id="edit-session-location"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Room 201"
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.title}" on ${deleteTarget.date} will be permanently removed.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending || !deleteTarget}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
