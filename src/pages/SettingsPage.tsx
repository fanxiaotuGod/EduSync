import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { updateCurrentUser } from "@/lib/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const email = user?.email ?? "";
  const roleLabel =
    user?.role === "teacher"
      ? "Teacher"
      : user?.role === "student"
        ? "Student"
        : user?.role ?? "";

  const saveMutation = useMutation({
    mutationFn: () => updateCurrentUser({ display_name: name.trim() }),
    onSuccess: (profile) => {
      updateUser({ name: profile.display_name });
      toast.success("Profile updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Display name cannot be empty");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-header">Settings</h1>
        <p className="page-subtitle">Manage your profile and preferences</p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                  {(name || "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" type="button" disabled>
                Change Photo
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9"
                  disabled={saveMutation.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={email} disabled className="h-9 bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Input value={roleLabel} disabled className="h-9 bg-muted capitalize" />
              </div>
            </div>

            <Button size="sm" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Language</Label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Full interface translation ships in P1-09 (i18n).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
