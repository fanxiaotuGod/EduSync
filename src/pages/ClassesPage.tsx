import { useState } from "react";
import { Plus, Users, MoreHorizontal, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockClasses } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ClassesPage() {
  const [search, setSearch] = useState("");
  const filtered = mockClasses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Classes</h1>
          <p className="page-subtitle">Manage your classes and student groups</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Create Class
        </Button>
      </div>

      <Input
        placeholder="Search classes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm h-9 bg-secondary/50 border-0 text-sm"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cls, i) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow group cursor-pointer overflow-hidden">
              <div className="h-2" style={{ backgroundColor: cls.color }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{cls.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{cls.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {cls.studentCount} students
                  </span>
                  <span>{cls.teacherName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    {cls.billingMode === "per_hour" ? "Per Hour" : "Per Session"} · ¥{cls.unitPrice}
                  </Badge>
                  <button
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(cls.code);
                      toast.success("Class code copied!");
                    }}
                  >
                    <Copy className="w-3 h-3" /> {cls.code}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
