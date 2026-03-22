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

**Dependencies:** None

---

#### BE-01-A · Flask Project Structure & Dependencies

Set up the backend folder layout and install all required packages.

**Folder structure to create:**
```
backend/
├── app/
│   ├── __init__.py          # App factory: create_app()
│   ├── config.py            # Config class, loads from .env
│   ├── extensions.py        # Supabase client singleton
│   ├── blueprints/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── classes.py
│   │   ├── sessions.py
│   │   ├── assignments.py
│   │   ├── tuition.py
│   │   └── notifications.py
│   └── utils/
│       ├── auth_decorators.py   # @require_auth, @require_role
│       └── response.py          # Standardized JSON response helpers
├── .env.example
├── requirements.txt
└── run.py                   # Entry point: app.run()
```

**`requirements.txt` packages:**
```
flask==3.0.3
flask-cors==4.0.1
supabase==2.5.0
python-dotenv==1.0.1
bcrypt==4.1.3
pyjwt==2.8.0
gunicorn==22.0.0
resend==2.3.0
apscheduler==3.10.4
reportlab==4.2.0
```

**Acceptance criteria:**
- `python run.py` starts Flask on port 5000 with no errors
- `GET /api/health` returns `{ "status": "ok" }`
- All blueprints registered with `/api` prefix
- CORS configured to allow frontend origin

---

#### BE-01-B · Environment Variables & Supabase Client

Wire up `.env` and initialize the Supabase client as a shared singleton.

**`.env.example` variables:**
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_min_32_chars
RESEND_API_KEY=re_xxxx
FLASK_ENV=development
FRONTEND_URL=http://localhost:8080
LOW_BALANCE_THRESHOLD_SESSIONS=2
LOW_BALANCE_THRESHOLD_HOURS=2
```

**`extensions.py`** should expose a `supabase` client instance initialized with `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (service role key bypasses RLS for backend operations).

**Acceptance criteria:**
- App fails to start with a clear error if any required env var is missing
- `supabase.table("users").select("*").limit(1).execute()` succeeds in a smoke test

---

#### BE-01-C · Database Table: `companies` & `users`

Create these two foundational tables in Supabase (SQL editor or migration file).

**`companies`**
```sql
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

**`users`**
```sql
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID REFERENCES companies(id),
  email                 TEXT UNIQUE NOT NULL,
  password_hash         TEXT NOT NULL,
  name                  TEXT NOT NULL,
  role                  TEXT NOT NULL CHECK (role IN ('admin','teacher','student')),
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('active','pending','inactive','rejected')),
  phone                 TEXT,
  bio                   TEXT,
  avatar_url            TEXT,
  subject               TEXT,           -- teacher only
  grade                 TEXT,           -- student only
  language_pref         TEXT DEFAULT 'zh',
  allow_price_adjust    BOOLEAN DEFAULT false, -- teacher only
  email_notifications   BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_role   ON users(role);
CREATE INDEX idx_users_company ON users(company_id);
```

**Acceptance criteria:**
- Tables visible in Supabase dashboard
- Insert one admin row manually → succeeds
- Email uniqueness constraint rejects duplicate insert

---

#### BE-01-D · Database Tables: `class_groups` & `class_enrollments`

**`class_groups`**
```sql
CREATE TABLE class_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id),
  teacher_id    UUID NOT NULL REFERENCES users(id),
  name          TEXT NOT NULL,
  description   TEXT,
  code          TEXT UNIQUE NOT NULL,   -- e.g. "MATH-A1"
  billing_mode  TEXT NOT NULL CHECK (billing_mode IN ('per_hour','per_session')),
  unit_price    NUMERIC(10,2) NOT NULL,
  color         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_classes_teacher ON class_groups(teacher_id);
CREATE INDEX idx_classes_code    ON class_groups(code);
```

**`class_enrollments`**
```sql
CREATE TABLE class_enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     UUID NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (class_id, student_id)
);

CREATE INDEX idx_enroll_class   ON class_enrollments(class_id);
CREATE INDEX idx_enroll_student ON class_enrollments(student_id);
```

**Acceptance criteria:**
- `UNIQUE (class_id, student_id)` prevents duplicate enrollment
- Deleting a class cascades and removes all enrollments

---

#### BE-01-E · Database Tables: `sessions` & `reschedule_requests`

**`sessions`**
```sql
CREATE TABLE sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id            UUID NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  date                DATE NOT NULL,
  start_time          TIME NOT NULL,
  end_time            TIME NOT NULL,
  location            TEXT,
  type                TEXT NOT NULL CHECK (type IN ('one-time','recurring')),
  recurrence_rule     TEXT,              -- 'weekly' | 'biweekly' | 'monthly'
  recurrence_group_id UUID,              -- groups all instances of a recurring series
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_class ON sessions(class_id);
CREATE INDEX idx_sessions_date  ON sessions(date);
```

**`reschedule_requests`**
```sql
CREATE TABLE reschedule_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES sessions(id),
  student_id            UUID NOT NULL REFERENCES users(id),
  reason                TEXT,
  proposed_date         DATE,
  proposed_start_time   TIME,
  proposed_end_time     TIME,
  status                TEXT DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
  teacher_feedback      TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  resolved_at           TIMESTAMPTZ
);
```

**Acceptance criteria:**
- `recurrence_group_id` allows fetching all sessions in a series with one query
- Index on `date` ensures calendar range queries are fast

---

#### BE-01-F · Database Tables: `assignments` & `submissions`

**`assignments`**
```sql
CREATE TABLE assignments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id            UUID NOT NULL REFERENCES class_groups(id),
  title               TEXT NOT NULL,
  description         TEXT,
  due_date            TIMESTAMPTZ NOT NULL,
  accepted_file_types TEXT[],           -- e.g. ['pdf','docx','jpg','png']
  assigned_to         TEXT DEFAULT 'all' CHECK (assigned_to IN ('all','specific')),
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- When assigned_to = 'specific', list target students here
CREATE TABLE assignment_targets (
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id    UUID REFERENCES users(id),
  PRIMARY KEY (assignment_id, student_id)
);
```

**`submissions`**
```sql
CREATE TABLE submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES assignments(id),
  student_id      UUID NOT NULL REFERENCES users(id),
  file_url        TEXT NOT NULL,         -- Supabase Storage path
  file_name       TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  grade           TEXT,
  feedback        TEXT,
  graded_at       TIMESTAMPTZ,
  graded_by       UUID REFERENCES users(id),
  UNIQUE (assignment_id, student_id)     -- one submission per student per assignment
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student    ON submissions(student_id);
```

**Acceptance criteria:**
- `UNIQUE (assignment_id, student_id)` enforced (resubmit = `UPDATE`, not `INSERT`)
- `accepted_file_types` is a Postgres array; query with `= ANY(accepted_file_types)`

---

#### BE-01-G · Database Tables: `student_balances`, `transactions` & `price_change_logs`

**`student_balances`**
```sql
CREATE TABLE student_balances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES users(id),
  class_id    UUID NOT NULL REFERENCES class_groups(id),
  balance     NUMERIC(10,2) DEFAULT 0,
  unit        TEXT NOT NULL,   -- 'sessions' | 'hours'
  status      TEXT GENERATED ALWAYS AS (
                CASE
                  WHEN balance <= 0 THEN 'zero'
                  WHEN balance <= 2  THEN 'low'
                  ELSE 'sufficient'
                END
              ) STORED,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, class_id)
);
```

**`transactions`**
```sql
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES users(id),
  class_id        UUID NOT NULL REFERENCES class_groups(id),
  session_id      UUID REFERENCES sessions(id),   -- null for manual top-ups
  type            TEXT NOT NULL CHECK (type IN ('topup','deduction')),
  amount          NUMERIC(10,2) NOT NULL,
  unit            TEXT NOT NULL,
  balance_after   NUMERIC(10,2) NOT NULL,
  comment         TEXT,
  recorded_by     UUID REFERENCES users(id),       -- null = system
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tx_student ON transactions(student_id);
CREATE INDEX idx_tx_class   ON transactions(class_id);
CREATE INDEX idx_tx_date    ON transactions(created_at);
```

**`price_change_logs`** (immutable audit log)
```sql
CREATE TABLE price_change_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES class_groups(id),
  old_price   NUMERIC(10,2),
  new_price   NUMERIC(10,2),
  changed_by  UUID NOT NULL REFERENCES users(id),
  changed_at  TIMESTAMPTZ DEFAULT now()
);
```

**Acceptance criteria:**
- `status` column auto-computes from `balance` (no manual updates needed)
- `transactions` rows are append-only; no `UPDATE` or `DELETE` allowed on this table

---

#### BE-01-H · Database Table: `notifications`

**`notifications`**
```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info','warning','success')),
  read        BOOLEAN DEFAULT false,
  link        TEXT,    -- frontend route to deep-link (e.g. '/assignments/a1')
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_user    ON notifications(user_id);
CREATE INDEX idx_notif_created ON notifications(created_at);

-- Auto-delete notifications older than 30 days (run as a cron or pg_cron)
```

**Acceptance criteria:**
- Index on `(user_id, read, created_at)` ensures fast unread count queries
- Records older than 30 days are purged (either via pg_cron or APScheduler job)

---

#### BE-01-I · Supabase Storage Bucket Setup

Create the storage bucket for assignment file uploads.

- Create bucket `submissions` in Supabase Storage (private)
- File path convention: `submissions/{assignment_id}/{student_id}/{filename}`
- Max file size: 20MB
- Allowed MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/jpeg`, `image/png`
- Backend generates a **signed URL** (1-hour expiry) for teacher download — never expose raw bucket path to client

**Acceptance criteria:**
- Upload a test file via Supabase dashboard → succeeds
- Signed URL generated in Python with `supabase.storage.from_("submissions").create_signed_url(path, 3600)`

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
