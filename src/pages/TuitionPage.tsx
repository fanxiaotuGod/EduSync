import { useState } from "react";
import { DollarSign, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { studentBalances, mockTransactions, mockClasses } from "@/lib/mock-data";
import { motion } from "framer-motion";

export default function TuitionPage() {
  const [classFilter, setClassFilter] = useState("all");
  const [tab, setTab] = useState<"overview" | "transactions">("overview");

  const filteredBalances = classFilter === "all"
    ? studentBalances
    : studentBalances.filter((b) => b.classId === classFilter);

  const filteredTransactions = classFilter === "all"
    ? mockTransactions
    : mockTransactions.filter((t) => t.classId === classFilter);

  const totalStudents = filteredBalances.length;
  const lowCount = filteredBalances.filter((b) => b.status === "low").length;
  const zeroCount = filteredBalances.filter((b) => b.status === "zero").length;

  const statusColors: Record<string, string> = {
    sufficient: "bg-success/10 text-success border-success/20",
    low: "bg-warning/10 text-warning border-warning/20",
    zero: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Tuition</h1>
          <p className="page-subtitle">Track student balances and payment records</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <DollarSign className="w-4 h-4" /> Record Top-up
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Students", value: totalStudents, icon: TrendingUp, color: "text-primary" },
          { label: "Low Balance", value: lowCount, icon: AlertTriangle, color: "text-warning" },
          { label: "Zero Balance", value: zeroCount, icon: AlertTriangle, color: "text-destructive" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="stat-card"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-secondary rounded-lg p-0.5">
          <Button variant={tab === "overview" ? "default" : "ghost"} size="sm" className="h-7 text-xs px-3" onClick={() => setTab("overview")}>Balances</Button>
          <Button variant={tab === "transactions" ? "default" : "ghost"} size="sm" className="h-7 text-xs px-3" onClick={() => setTab("transactions")}>Transactions</Button>
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
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
      </div>

      {tab === "overview" && (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="text-xs font-medium">Student</TableHead>
                <TableHead className="text-xs font-medium">Class</TableHead>
                <TableHead className="text-xs font-medium">Balance</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBalances.map((b) => (
                <TableRow key={`${b.studentId}-${b.classId}`} className="cursor-pointer hover:bg-secondary/20">
                  <TableCell className="font-medium text-sm">{b.studentName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.className}</TableCell>
                  <TableCell className="text-sm font-semibold">{b.balance} {b.unit}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[b.status]}`}>
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === "transactions" && (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="text-xs font-medium">Date</TableHead>
                <TableHead className="text-xs font-medium">Student</TableHead>
                <TableHead className="text-xs font-medium">Type</TableHead>
                <TableHead className="text-xs font-medium">Amount</TableHead>
                <TableHead className="text-xs font-medium">Balance After</TableHead>
                <TableHead className="text-xs font-medium">Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => (
                <TableRow key={t.id} className="hover:bg-secondary/20">
                  <TableCell className="text-sm text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="text-sm font-medium">{t.studentName}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      t.type === "topup" ? "text-success" : "text-destructive"
                    }`}>
                      {t.type === "topup" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.type === "topup" ? "Top-up" : "Deduction"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {t.type === "topup" ? "+" : "-"}{t.amount} {t.unit}
                  </TableCell>
                  <TableCell className="text-sm">{t.balanceAfter} {t.unit}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.comment}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
