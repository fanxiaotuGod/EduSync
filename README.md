# EduSync

A web-based education management platform for teachers and students to manage class schedules, assignments, and tuition tracking. Supports role-based access (Admin / Teacher / Student) with English and Chinese (Simplified) interface.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Python / Flask |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Email | Resend API |
| File Storage | Supabase Storage |
| Frontend Hosting | Vercel |
| Backend Hosting | Linux VPS (Gunicorn + Nginx + systemd) |
| Public Tunnel | Cloudflare Tunnel |
| CI/CD | GitHub Actions |

---

## Project Structure

```
EduSync/
├── src/                  # React frontend
│   ├── components/       # Layout, sidebar, UI components
│   ├── pages/            # Dashboard, Calendar, Classes, Students, Assignments, Tuition, Notifications, Settings
│   ├── lib/              # Utilities, mock data (to be replaced with API calls)
│   └── hooks/            # Custom React hooks
├── backend/              # Flask backend (to be created)
└── README.md
```

---

## Backend Tickets

### Sprint 1 — Auth & User Management

---

**BE-01 · Project Setup & Database Schema**
> Initialize Flask project, connect Supabase, define all DB tables.

- Set up Flask app with blueprints structure (`auth`, `users`, `classes`, `sessions`, `assignments`, `tuition`, `notifications`)
- Configure Supabase client (PostgreSQL connection + Storage)
- Create DB tables: `users`, `companies`, `class_groups`, `class_enrollments`, `sessions`, `assignments`, `submissions`, `transactions`, `student_balances`, `notifications`, `reschedule_requests`
- Set up `python-dotenv` for env var management
- Add `requirements.txt`

**Dependencies:** None

---

**BE-02 · Admin Registration**
> Admin registers a company account; account is immediately active.

- `POST /api/auth/register/admin`
- Fields: `company_name`, `email`, `password`
- Creates `company` record + `user` record with `role=admin`, `status=active`
- Returns JWT token

**Dependencies:** BE-01

---

**BE-03 · Teacher Registration & Approval Flow**
> Teacher registers, selects company, waits for Admin approval.

- `POST /api/auth/register/teacher` — creates user with `status=pending`, sends in-app + email notification to Admin
- `GET /api/admin/pending-teachers` — Admin lists pending teachers
- `POST /api/admin/teachers/:id/approve` — sets `status=active`, notifies teacher via Resend email
- `POST /api/admin/teachers/:id/reject` — sets `status=rejected` with optional reason, notifies teacher

**Dependencies:** BE-02

---

**BE-04 · Student Registration**
> Student registers and is immediately active (no approval required).

- `POST /api/auth/register/student`
- Fields: `name`, `email`, `password`, `grade`
- Creates user with `role=student`, `status=active`
- Returns JWT token

**Dependencies:** BE-01

---

**BE-05 · Login, Session & Password Reset**
> All roles log in via email + password; role-based redirect; password reset via Resend.

- `POST /api/auth/login` — validates credentials, returns JWT, includes `role` in payload
- `POST /api/auth/forgot-password` — generates 1-hour reset token, sends reset link via Resend
- `POST /api/auth/reset-password` — validates token, updates hashed password
- Passwords hashed with `bcrypt`

**Dependencies:** BE-01

---

**BE-06 · JWT Middleware & Role-Based Route Protection**
> All protected routes require valid JWT; role guards enforce permissions.

- `@require_auth` decorator — validates Bearer token on all protected routes
- `@require_role('admin')`, `@require_role('teacher')`, `@require_role('student')` decorators
- Return `401` for missing/invalid token, `403` for insufficient role

**Dependencies:** BE-05

---

**BE-07 · User Profile Management**
> Users can view and update their own profile.

- `GET /api/users/me` — returns current user's profile
- `PATCH /api/users/me` — update: `display_name`, `phone`, `bio`, `avatar_url`, `subject` (teacher), `grade` (student), `language_preference`
- Avatar upload to Supabase Storage, returns public URL
- `GET /api/admin/users` — Admin lists all users with search by name/email/grade
- `PATCH /api/admin/users/:id` — Admin edits any user
- `PATCH /api/admin/users/:id/deactivate` — Admin deactivates account

**Dependencies:** BE-06

---

### Sprint 2 — Class Management

---

**BE-08 · Class CRUD**
> Teachers and Admins create and manage classes.

- `POST /api/classes` — create class: `name`, `description`, `billing_mode` (per_hour / per_session), `unit_price`, auto-generate unique `code`
- `GET /api/classes` — Teacher gets own classes; Admin gets all classes (with optional `?search=` query)
- `GET /api/classes/:id` — class detail
- `PATCH /api/classes/:id` — edit class (teacher owns it or admin)
- `DELETE /api/classes/:id` — delete with confirmation (teacher owns it or admin)

**Dependencies:** BE-06

---

**BE-09 · Student Invite & Join**
> Teacher invites students via email or class code; student joins class.

- `POST /api/classes/:id/invite` — send invite email via Resend with one-click join link (signed token)
- `POST /api/classes/join` — student joins via `class_code`
- `GET /api/classes/join/:token` — student joins via email invite link (validate signed token)
- Creates `class_enrollment` record on join
- `GET /api/classes/:id/students` — list enrolled students
- `DELETE /api/classes/:id/students/:studentId` — remove student from class

**Dependencies:** BE-08

---

### Sprint 3 — Calendar & Session Management

---

**BE-10 · Session Creation (One-time & Recurring)**
> Teachers create one-time or recurring sessions; sessions appear on all enrolled students' calendars.

- `POST /api/sessions` — fields: `class_id`, `title`, `date`, `start_time`, `end_time`, `location`, `type` (one-time / recurring), `recurrence_rule` (weekly/biweekly/monthly), `recurrence_end_date`
- For recurring: auto-generate all session instances up to `recurrence_end_date`
- `GET /api/sessions` — Teacher: all their sessions; Student: only their enrolled sessions; filter by `?class_id=`, `?date=`, `?month=`
- `GET /api/sessions/:id` — session detail with notes
- `PATCH /api/sessions/:id` — edit session (teacher only)
- `DELETE /api/sessions/:id` — delete session

**Dependencies:** BE-09

---

**BE-11 · Session Notes**
> Teacher adds notes to a student's session; student gets notified.

- `POST /api/sessions/:id/notes` — teacher adds/updates notes and assignment reminders on a session
- Note is visible to all enrolled students of that session
- Triggers in-app + email notification to affected students

**Dependencies:** BE-10, BE-18

---

**BE-12 · Reschedule Request Flow**
> Student requests reschedule; teacher approves or rejects; calendar updates automatically.

- `POST /api/sessions/:id/reschedule-request` — student submits: `reason`, `proposed_date`, `proposed_start_time`, `proposed_end_time`; status = `pending`
- `GET /api/reschedule-requests` — Teacher sees all pending requests for their classes
- `POST /api/reschedule-requests/:id/approve` — teacher approves; session updated; student notified
- `POST /api/reschedule-requests/:id/reject` — teacher rejects with optional feedback; student notified
- If approved: no balance deduction for original session

**Dependencies:** BE-10, BE-18

---

### Sprint 4 — Assignment System

---

**BE-13 · Assignment CRUD**
> Teachers create assignments for a class or specific students.

- `POST /api/assignments` — fields: `class_id`, `title`, `description`, `due_date`, `accepted_file_types`, `assigned_to` (all / list of student IDs)
- Creates `assignment` record; links to specific students or entire class enrollment
- Assignment appears in student's list and calendar on due date
- `GET /api/assignments` — Teacher: own classes; Student: their assignments sorted by due date
- `PATCH /api/assignments/:id` — edit (teacher)
- `DELETE /api/assignments/:id`

**Dependencies:** BE-09

---

**BE-14 · Assignment Submission**
> Students upload files to submit assignments; can resubmit before due date.

- `POST /api/assignments/:id/submit` — multipart upload (PDF, .doc, .docx, JPEG, PNG; max 20MB)
- File stored in Supabase Storage; records `submission_timestamp`
- Student can resubmit before due date (overwrites previous submission)
- Student receives confirmation notification on submission
- `GET /api/assignments/:id/submissions` — Teacher views all submissions with student name and timestamp
- `GET /api/assignments/:id/submissions/:submissionId/download` — Teacher downloads file

**Dependencies:** BE-13, BE-18

---

**BE-15 · Grading & Feedback**
> Teacher grades submissions and provides feedback; student is notified.

- `PATCH /api/submissions/:id/grade` — teacher enters `grade` (numeric or letter) and `feedback` text
- Student is notified in-app + email when graded
- `GET /api/assignments/:id/my-submission` — Student views own grade, feedback, submission status

**Dependencies:** BE-14, BE-18

---

**BE-16 · Assignment Deadline Reminders (Cron Job)**
> Automated reminders sent 24 hours and 1 hour before due date.

- Scheduled job runs every 15 minutes
- Checks assignments due in ~24h: sends in-app + email reminder to unsubmitted students
- Checks assignments due in ~1h: sends second reminder to unsubmitted students
- Uses Resend for email; references assignment title and class name

**Dependencies:** BE-13, BE-18

---

### Sprint 5 — Tuition Management

---

**BE-17 · Pricing Setup & Permission**
> Admin sets billing mode and unit price per class; optionally grants teachers price-edit permission.

- `PATCH /api/classes/:id/pricing` — Admin sets `billing_mode` and `unit_price` (already part of BE-08 class creation, here adds audit log)
- `PATCH /api/admin/teachers/:id/price-permission` — Admin toggles `allow_price_adjustment` flag
- If teacher has permission: `PATCH /api/classes/:id/pricing` allowed for teacher (own classes only)
- All price changes logged immutably: `timestamp`, `editor_id`, `old_price`, `new_price`
- Admin receives in-app notification when teacher changes price

**Dependencies:** BE-08

---

**BE-18 · Student Balance & Top-Up**
> Admin/Teacher manually records top-up; system auto-deducts on session completion.

- `GET /api/students/:id/balance` — returns current balance per class (hours / sessions / amount)
- `POST /api/students/:id/topup` — Admin/Teacher records top-up: `class_id`, `amount`, `unit`, `comment`; updates `student_balances` table; logs to `transactions`
- `GET /api/students/:id/transactions` — full transaction history, filterable by date range
- Cron job: after a session's `end_time` passes → auto-deduct 1 session or duration hours from enrolled students' balances (skip if approved reschedule/absence exists)
- All deductions logged: `type=deduction`, `recorded_by=system`

**Dependencies:** BE-10

---

**BE-19 · Low Balance Alerts**
> Trigger notifications when student balance falls below threshold.

- Configurable threshold per Admin (default: 2 sessions or 2 hours)
- `PATCH /api/admin/settings/low-balance-threshold` — Admin sets threshold
- After every deduction: check if balance ≤ threshold → send in-app + email to student, teacher, and Admin
- `GET /api/admin/tuition-overview` — total students, low-balance students, sessions completed this month, list filterable by class/teacher

**Dependencies:** BE-18

---

**BE-20 · Tuition Reports & PDF Export**
> Admin/Teacher generates per-student or all-students tuition report as PDF.

- `GET /api/reports/tuition?student_id=&start_date=&end_date=` — returns: sessions completed, total deducted, total topped up, current balance
- `GET /api/reports/tuition/export?...` — generates PDF via `reportlab` or `weasyprint`; includes student name, class, date range, transaction summary

**Dependencies:** BE-18

---

### Sprint 6 — Notifications

---

**BE-21 · Notification System**
> Centralized in-app notification creation and delivery.

- `notifications` table: `user_id`, `title`, `message`, `type`, `read`, `link`, `created_at`
- `POST /api/internal/notify` (internal helper) — creates notification records for one or multiple users
- `GET /api/notifications` — current user's notifications (last 30 days), with unread count
- `PATCH /api/notifications/:id/read` — mark single notification as read
- `POST /api/notifications/read-all` — mark all as read

**Dependencies:** BE-06

---

## Deployment Plan

### Phase 2 — Public Access via Cloudflare Tunnel

**OPS-01 · Register Cloudflare & Install cloudflared**
- Register Cloudflare account at cloudflare.com
- Install `cloudflared` on VPS: `curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && dpkg -i cloudflared.deb`
- Authenticate: `cloudflared tunnel login`

**OPS-02 · Create Tunnel & Bind Domain**
- Create tunnel: `cloudflared tunnel create edusync`
- Add DNS CNAME record in Cloudflare dashboard pointing your domain → tunnel ID
- Configure `~/.cloudflared/config.yml` to route `yourdomain.com` → `localhost:5000` (Flask port)
- Run tunnel: `cloudflared tunnel run edusync`

---

### Phase 3 — Flask Backend Deployment

**OPS-03 · Python Environment Setup**
- Install `pyenv` on VPS, set Python 3.11+
- Create venv: `python -m venv venv`
- Install deps: `pip install -r requirements.txt`
- Install Gunicorn: `pip install gunicorn`

**OPS-04 · Nginx Reverse Proxy**
- Install Nginx: `apt install nginx`
- Create `/etc/nginx/sites-available/edusync`:
  ```
  server {
      listen 80;
      server_name yourdomain.com;
      location / {
          proxy_pass http://127.0.0.1:5000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
  ```
- Enable site: `ln -s /etc/nginx/sites-available/edusync /etc/nginx/sites-enabled/`
- `nginx -t && systemctl reload nginx`

**OPS-05 · systemd Service for Flask**
- Create `/etc/systemd/system/edusync.service`:
  ```
  [Unit]
  Description=EduSync Flask Backend
  After=network.target

  [Service]
  User=ubuntu
  WorkingDirectory=/home/ubuntu/EduSync/backend
  EnvironmentFile=/home/ubuntu/EduSync/backend/.env
  ExecStart=/home/ubuntu/EduSync/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
  Restart=always

  [Install]
  WantedBy=multi-user.target
  ```
- `systemctl enable edusync && systemctl start edusync`

**OPS-06 · Environment Variables**
- Create `backend/.env` on server (never commit to git):
  ```
  SUPABASE_URL=...
  SUPABASE_KEY=...
  JWT_SECRET=...
  RESEND_API_KEY=...
  FLASK_ENV=production
  ```

---

### Phase 4 — CI/CD with GitHub Actions

**OPS-07 · GitHub Actions Auto-Deploy**
- Add GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- Create `.github/workflows/deploy.yml`:
  ```yaml
  on:
    push:
      branches: [main]
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - name: Deploy to VPS
          uses: appleboy/ssh-action@v1
          with:
            host: ${{ secrets.VPS_HOST }}
            username: ${{ secrets.VPS_USER }}
            key: ${{ secrets.VPS_SSH_KEY }}
            script: |
              cd ~/EduSync
              git pull origin main
              source backend/venv/bin/activate
              pip install -r backend/requirements.txt
              sudo systemctl restart edusync
  ```

---

### Phase 5 — Frontend Deployment on Vercel

**OPS-08 · Connect Vercel to GitHub**
- Go to vercel.com → New Project → import `fanxiaotuGod/EduSync`
- Set build settings: Framework = Vite, Build Command = `npm run build`, Output = `dist`
- Add Environment Variable: `VITE_API_URL=https://yourdomain.com/api`

**OPS-09 · Update Frontend API Base URL**
- Replace all mock data imports in pages with real API calls using `VITE_API_URL`
- Every push to `main` triggers automatic Vercel redeploy

---

## Getting Started (Local Development)

```bash
# Frontend
npm install
npm run dev        # http://localhost:8080

# Backend (once created)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask run          # http://localhost:5000
```

---

*EduSync PRD v1.1 — Target Launch: October 2025*
