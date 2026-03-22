export type UserRole = "admin" | "teacher" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: "active" | "pending" | "inactive";
  phone?: string;
  subject?: string;
  grade?: string;
  createdAt: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  code: string;
  billingMode: "per_hour" | "per_session";
  unitPrice: number;
  color: string;
}

export interface Session {
  id: string;
  classId: string;
  className: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "one-time" | "recurring";
  color: string;
}

export interface Assignment {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  submittedCount: number;
  totalCount: number;
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  type: "topup" | "deduction";
  amount: number;
  unit: string;
  balanceAfter: number;
  comment: string;
  recordedBy: string;
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  read: boolean;
  date: string;
}

export const currentUser: User = {
  id: "u1",
  name: "李明",
  email: "liming@edusync.com",
  role: "teacher",
  status: "active",
  subject: "Mathematics",
  createdAt: "2025-09-01",
};

export const mockStudents: User[] = [
  { id: "s1", name: "张小华", email: "zhangxh@edu.com", role: "student", status: "active", grade: "Grade 10", createdAt: "2025-09-01" },
  { id: "s2", name: "王美丽", email: "wangml@edu.com", role: "student", status: "active", grade: "Grade 10", createdAt: "2025-09-02" },
  { id: "s3", name: "刘强", email: "liuq@edu.com", role: "student", status: "active", grade: "Grade 11", createdAt: "2025-09-03" },
  { id: "s4", name: "陈雪", email: "chenx@edu.com", role: "student", status: "active", grade: "Grade 11", createdAt: "2025-09-05" },
  { id: "s5", name: "赵伟", email: "zhaow@edu.com", role: "student", status: "pending", grade: "Grade 10", createdAt: "2025-09-10" },
  { id: "s6", name: "孙丽", email: "sunl@edu.com", role: "student", status: "active", grade: "Grade 12", createdAt: "2025-09-12" },
  { id: "s7", name: "周杰", email: "zhouj@edu.com", role: "student", status: "inactive", grade: "Grade 9", createdAt: "2025-08-20" },
  { id: "s8", name: "吴芳", email: "wuf@edu.com", role: "student", status: "active", grade: "Grade 10", createdAt: "2025-09-15" },
];

export const mockTeachers: User[] = [
  { id: "t1", name: "李明", email: "liming@edusync.com", role: "teacher", status: "active", subject: "Mathematics", createdAt: "2025-08-01" },
  { id: "t2", name: "王老师", email: "wangt@edusync.com", role: "teacher", status: "active", subject: "English", createdAt: "2025-08-05" },
  { id: "t3", name: "陈老师", email: "chent@edusync.com", role: "teacher", status: "pending", subject: "Physics", createdAt: "2025-09-20" },
];

export const mockClasses: ClassGroup[] = [
  { id: "c1", name: "高一数学 A班", description: "Algebra and Geometry", teacherId: "t1", teacherName: "李明", studentCount: 5, code: "MATH-A1", billingMode: "per_session", unitPrice: 200, color: "hsl(172, 66%, 40%)" },
  { id: "c2", name: "高二数学 B班", description: "Calculus Introduction", teacherId: "t1", teacherName: "李明", studentCount: 3, code: "MATH-B2", billingMode: "per_hour", unitPrice: 150, color: "hsl(210, 100%, 52%)" },
  { id: "c3", name: "英语口语班", description: "Spoken English Practice", teacherId: "t2", teacherName: "王老师", studentCount: 8, code: "ENG-SP1", billingMode: "per_session", unitPrice: 180, color: "hsl(38, 92%, 50%)" },
  { id: "c4", name: "物理竞赛班", description: "Physics Olympiad Prep", teacherId: "t2", teacherName: "王老师", studentCount: 4, code: "PHY-OL", billingMode: "per_hour", unitPrice: 250, color: "hsl(280, 60%, 50%)" },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const mockSessions: Session[] = [
  { id: "ss1", classId: "c1", className: "高一数学 A班", title: "Quadratic Equations", date: fmt(today), startTime: "09:00", endTime: "10:30", location: "Room 201", type: "recurring", color: "hsl(172, 66%, 40%)" },
  { id: "ss2", classId: "c2", className: "高二数学 B班", title: "Limits & Continuity", date: fmt(today), startTime: "14:00", endTime: "15:30", location: "Room 305", type: "recurring", color: "hsl(210, 100%, 52%)" },
  { id: "ss3", classId: "c1", className: "高一数学 A班", title: "Geometry Basics", date: fmt(addDays(today, 1)), startTime: "10:00", endTime: "11:30", location: "Room 201", type: "one-time", color: "hsl(172, 66%, 40%)" },
  { id: "ss4", classId: "c2", className: "高二数学 B班", title: "Derivatives Intro", date: fmt(addDays(today, 2)), startTime: "09:00", endTime: "10:30", location: "Room 305", type: "recurring", color: "hsl(210, 100%, 52%)" },
  { id: "ss5", classId: "c1", className: "高一数学 A班", title: "Trigonometry", date: fmt(addDays(today, 3)), startTime: "14:00", endTime: "15:30", location: "Room 201", type: "recurring", color: "hsl(172, 66%, 40%)" },
  { id: "ss6", classId: "c2", className: "高二数学 B班", title: "Integration Basics", date: fmt(addDays(today, 5)), startTime: "10:00", endTime: "11:30", location: "Online", type: "one-time", color: "hsl(210, 100%, 52%)" },
  { id: "ss7", classId: "c1", className: "高一数学 A班", title: "Review Session", date: fmt(addDays(today, -1)), startTime: "09:00", endTime: "10:30", location: "Room 201", type: "one-time", color: "hsl(172, 66%, 40%)" },
  { id: "ss8", classId: "c2", className: "高二数学 B班", title: "Practice Test", date: fmt(addDays(today, -2)), startTime: "14:00", endTime: "16:00", location: "Room 305", type: "one-time", color: "hsl(210, 100%, 52%)" },
];

export const mockAssignments: Assignment[] = [
  { id: "a1", classId: "c1", className: "高一数学 A班", title: "二次方程练习", description: "Complete exercises 1-20 from Chapter 3", dueDate: fmt(addDays(today, 3)), status: "pending", submittedCount: 2, totalCount: 5 },
  { id: "a2", classId: "c1", className: "高一数学 A班", title: "几何作图", description: "Draw and label geometric figures", dueDate: fmt(addDays(today, -1)), status: "graded", submittedCount: 5, totalCount: 5 },
  { id: "a3", classId: "c2", className: "高二数学 B班", title: "极限计算", description: "Solve limit problems set A", dueDate: fmt(addDays(today, 5)), status: "pending", submittedCount: 0, totalCount: 3 },
  { id: "a4", classId: "c2", className: "高二数学 B班", title: "导数应用", description: "Real-world derivative applications", dueDate: fmt(addDays(today, 1)), status: "submitted", submittedCount: 3, totalCount: 3 },
];

export const mockTransactions: Transaction[] = [
  { id: "tr1", studentId: "s1", studentName: "张小华", classId: "c1", className: "高一数学 A班", type: "topup", amount: 10, unit: "sessions", balanceAfter: 10, comment: "Cash payment", recordedBy: "李明", date: fmt(addDays(today, -30)) },
  { id: "tr2", studentId: "s1", studentName: "张小华", classId: "c1", className: "高一数学 A班", type: "deduction", amount: 1, unit: "session", balanceAfter: 9, comment: "Session completed", recordedBy: "System", date: fmt(addDays(today, -23)) },
  { id: "tr3", studentId: "s1", studentName: "张小华", classId: "c1", className: "高一数学 A班", type: "deduction", amount: 1, unit: "session", balanceAfter: 8, comment: "Session completed", recordedBy: "System", date: fmt(addDays(today, -16)) },
  { id: "tr4", studentId: "s2", studentName: "王美丽", classId: "c1", className: "高一数学 A班", type: "topup", amount: 5, unit: "sessions", balanceAfter: 5, comment: "WeChat payment", recordedBy: "李明", date: fmt(addDays(today, -20)) },
  { id: "tr5", studentId: "s2", studentName: "王美丽", classId: "c1", className: "高一数学 A班", type: "deduction", amount: 1, unit: "session", balanceAfter: 4, comment: "Session completed", recordedBy: "System", date: fmt(addDays(today, -13)) },
  { id: "tr6", studentId: "s3", studentName: "刘强", classId: "c2", className: "高二数学 B班", type: "topup", amount: 20, unit: "hours", balanceAfter: 20, comment: "Bank transfer", recordedBy: "李明", date: fmt(addDays(today, -25)) },
  { id: "tr7", studentId: "s3", studentName: "刘强", classId: "c2", className: "高二数学 B班", type: "deduction", amount: 1.5, unit: "hours", balanceAfter: 18.5, comment: "Session completed", recordedBy: "System", date: fmt(addDays(today, -18)) },
];

export const mockNotifications: Notification[] = [
  { id: "n1", title: "新学生加入", message: "赵伟已加入 高一数学 A班", type: "info", read: false, date: fmt(today) },
  { id: "n2", title: "改课请求", message: "张小华请求更改3月25日课程时间", type: "warning", read: false, date: fmt(today) },
  { id: "n3", title: "作业已提交", message: "所有学生已提交 导数应用 作业", type: "success", read: true, date: fmt(addDays(today, -1)) },
  { id: "n4", title: "余额不足", message: "王美丽的课时余额不足（剩余4节）", type: "warning", read: false, date: fmt(addDays(today, -1)) },
];

export const studentBalances = [
  { studentId: "s1", studentName: "张小华", classId: "c1", className: "高一数学 A班", balance: 8, unit: "sessions", status: "sufficient" as const },
  { studentId: "s2", studentName: "王美丽", classId: "c1", className: "高一数学 A班", balance: 4, unit: "sessions", status: "sufficient" as const },
  { studentId: "s3", studentName: "刘强", classId: "c2", className: "高二数学 B班", balance: 18.5, unit: "hours", status: "sufficient" as const },
  { studentId: "s4", studentName: "陈雪", classId: "c1", className: "高一数学 A班", balance: 2, unit: "sessions", status: "low" as const },
  { studentId: "s6", studentName: "孙丽", classId: "c2", className: "高二数学 B班", balance: 1, unit: "hours", status: "low" as const },
  { studentId: "s8", studentName: "吴芳", classId: "c1", className: "高一数学 A班", balance: 0, unit: "sessions", status: "zero" as const },
];
