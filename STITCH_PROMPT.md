# Prompt para AI Stitch — Sistema de Gestão Escolar

> Copie e cole o bloco abaixo diretamente no Stitch.

---

```
Create a complete web application UI for a School Management System (Sistema de Gestão Escolar) used by a Brazilian technical college. The app has three user roles with completely different experiences: Admin (secretary/coordinator), Professor (teacher), and Student (aluno).

---

TECH STACK
- React 18 + TypeScript + Vite
- Tailwind CSS v3
- React Router v7
- TanStack Query v5
- Zustand (auth state)

---

DESIGN SYSTEM

Color palette:
- Primary: #1E40AF (blue-800) — buttons, active nav, badges
- Sidebar background: #1E293B (slate-800)
- Sidebar active text: white
- Sidebar inactive text: #94A3B8
- Page background: #F1F5F9 (slate-100)
- Cards: white with subtle shadow
- Success: #16A34A (green)
- Danger: #DC2626 (red)
- Warning: #D97706 (amber)

Typography: Inter font. Page titles: text-2xl font-semibold. Table data: text-sm. Labels: text-sm font-medium text-slate-700.

Style reference: Vercel Dashboard, Linear, Google Admin Console. Professional, clean, data-dense but elegant. Flat design, rounded corners, no excessive decoration.

---

GLOBAL LAYOUT (all authenticated screens)

Fixed sidebar (240px) on the left with dark background + fixed topbar at top.
Topbar contains: school logo on the left, user name + role badge on the right, and a notification bell with unread count badge.
Main content area fills the rest with light gray background.
Sidebar collapses to icon-only on tablet, hidden with hamburger on mobile.

---

ROLE-BASED SIDEBAR MENUS

ADMIN menu:
- Dashboard (chart icon)
- Students (users icon) — with sub-items: List, New
- Teachers (academic cap icon) — with sub-items: List, New
- Classes (building icon) — with sub-items: List, New
- Disciplines (book icon)
- Calendar (calendar icon)
- Assessments (clipboard icon)
- Grades (chart bar icon)
- Communications (chat bubble icon) — with unread badge
- Settings (cog icon)

PROFESSOR menu:
- Dashboard
- My Profile
- My Schedule (timetable)
- Attendance (check circle)
- Assessments
- Grades
- Communications — with unread badge

STUDENT menu:
- Dashboard
- My Profile
- Report Card (boletim)
- Attendance
- Schedule
- Communications — with unread badge
- Academic History

---

SCREENS TO GENERATE

--- SCREEN 1: Login Page ---
Full-page centered layout with subtle gradient background.
White card (max 420px) centered with rounded corners and shadow.
School logo at top of card.
Title: "Acesso ao Sistema".
Email field, password field (with show/hide toggle), primary "Entrar" button (full width).
Error message in red below the form.
Loading spinner inside button during request.

--- SCREEN 2: Admin Dashboard ---
4 stat cards in a row at the top: Total Students (148), Total Teachers (24), Active Classes (12), Unread Communications (5). Each card has a large icon, big number, and label. Cards are clickable.
Below: two columns.
Left column (60%): "Recent Grades" table with columns: Student, Subject, Quarter, Grade (colored badge: green ≥6, red <6), Date.
Right column (40%): "Quick Actions" section with 4 action buttons (+ New Student, + New Teacher, + New Class, + New Communication), and below that "Upcoming Calendar Events" list showing date + description + type badge.

--- SCREEN 3: Student List (Admin) ---
Page header: "Students" h1 + badge "148 registered" + "+ Register Student" button on the right.
Search bar on left (search by name/enrollment/email) + Status dropdown filter on right (All / Active / Inactive).
Data table with columns: Enrollment, Full Name, Email, Class, Status (green badge "Active" or gray "Inactive"), Actions (view eye icon, edit pencil icon, deactivate trash icon).
Pagination footer: "Showing 1–20 of 148" with Previous/Next buttons and items-per-page selector.

--- SCREEN 4: Student Detail with Tabs (Admin) ---
Page header showing: student name as h1, enrollment number as subtitle, class badge, status badge.
Tab navigation: "Personal Data" | "Attendance" | "Report Card" | "Academic History".

Active tab "Report Card" showing:
A table with subjects as rows and quarters (1º, 2º, 3º, 4º) as columns, plus Recovery, Annual Average, and Status columns.
Example data:
- Matemática: 7.5 | 8.0 | 6.5 | 7.0 | — | 7.25 | ✅ Approved
- Português: 5.0 | 5.5 | 6.0 | 6.5 | 6.5* | 6.25 | ✅ Approved
- Física: 4.0 | 3.5 | 5.0 | 4.5 | — | 4.25 | ⚠️ Final Exam
Grades below 6.0 in red text. Status as colored badges.

--- SCREEN 5: Professor Dashboard ---
Greeting: "Olá, Maria!" with current date.
Two columns:
Left: "Today's Schedule" card showing a vertical list of classes (time + subject + class name). Example: 19:00 Matemática - Turma 3A, 20:40 Matemática - Turma 3B.
Right: "Communications" card showing 3 unread messages as list items with blue dot indicator.
Below full width: "Pending Grade Entries" section — a list of assessments that have students without grades, each item showing: assessment name, subject, class, and "X students pending" with a "Launch Grades" button.

--- SCREEN 6: Attendance (Professor) ---
Page header: "Attendance Record".
Step 1 — filter bar: Class dropdown + Subject dropdown + Date picker + Quarter selector (1-4). "Load Students" button.
Step 2 — attendance list:
Header showing: "Turma 3A · Matemática · 07/04/2026 · 1st Quarter" and counter badge "35 students · 30 present · 5 absent".
List of students, each row: student name + enrollment + toggle button group [Present | Absent]. Present = green active, Absent = red active.
"Save Attendance" primary button at the bottom.

--- SCREEN 7: Grade Entry Table (Professor/Admin) ---
Page header: "Launch Grades".
Assessment selector at top: shows assessment title, type badge, subject, class, quarter, date.
Table below with columns: Student, Enrollment, Grade (numeric input 0–10, step 0.5), Status.
Each grade input: styled input, turns green border when filled with ≥6, red border when <6.
Status column: "Pending" (gray badge) or "Saved ✅" (green badge).
"Save All" primary button at bottom right + "Save" icon button per row.

--- SCREEN 8: Communications Page ---
Two-column layout.
Left panel (35%): list of communications with search at top. Each item shows: title (bold if unread), sender, date, and a colored type badge (GERAL=blue, TURMA=green, AUTOMÁTICO=gray, MANUAL=purple). Blue dot on left for unread items.
Right panel (65%): selected communication content. Shows title as h2, metadata row (From + Date + Audience), full content text, and "Mark as Read" button if unread.
Floating "+ New Communication" button at bottom-right (FAB style) for Admin/Professor.

--- SCREEN 9: New Communication Modal/Drawer ---
Slide-in drawer from the right (480px wide).
Title: "New Communication".
Fields:
- Subject/Title: text input
- Content: large textarea (min 6 rows)
- Audience (dropdown):
  - General (everyone)
  - Specific Class → shows class dropdown below
  - All Teachers
  - Manual List → shows user search/add field below
"Send" primary button + "Cancel" secondary button at bottom.

--- SCREEN 10: Settings — Admin ---
Page header: "Settings".
Section card "Grade Configuration":
- Label: "Minimum Passing Grade"
- Current value displayed as large text: 6.0
- Edit button that transforms it into an input + Save button
- Note: "This setting affects future assessments only."
Below: change history table — Date | Previous Value | New Value | Changed By.

--- SCREEN 11: Student Dashboard ---
Greeting: "Olá, João! Turma 3A · 2026".
Three sections in a grid:
Top left card: "My Report Card (summary)" — table with 4 subjects showing name + current average + status icon (✅/⚠️/❌) + "View Full Report Card" link.
Top right card: "Unread Communications" — list of 2 items with blue dot + "View All" link.
Bottom full width: "Upcoming Assessments" — horizontal card list, each card showing: assessment type badge, title, subject, date, quarter.

--- SCREEN 12: Calendar Page ---
Page header: "School Calendar" + toggle buttons [List View | Calendar View].
Active: Calendar View — standard monthly calendar grid. Events shown as colored pills inside date cells: FERIADO=red, RECESSO=orange, EVENTO=purple, AULA=blue.
Sidebar on the right: "Events This Month" list showing all events for the current month.
For Admin: "+ New Event" button in header. Clicking a date opens a modal to create an event.
Filter bar below header: Type dropdown + Month/Year navigation.

---

ADDITIONAL UI PATTERNS TO INCLUDE

Confirmation dialog: when deleting/deactivating, show a centered modal with warning icon, message "Are you sure? This action cannot be undone.", and "Cancel" + "Confirm" buttons.

Toast notifications: small cards that appear top-right. Green for success, red for error, amber for warning. Auto-dismiss after 4 seconds.

Empty state: when a table/list has no data, show a centered illustration (simple SVG), descriptive text, and a primary action button.

Loading skeleton: when data is loading, show animated gray placeholder rows instead of a spinner for tables.

Form validation: red border + small red text below invalid fields. Required fields marked with *.

---

RESPONSIVE BEHAVIOR
- Mobile (<768px): sidebar hidden behind hamburger, tables become stacked cards, forms single column
- Tablet (768-1024px): sidebar shows icons only (no text)
- Desktop (>1024px): full sidebar with text, multi-column layouts

---

IMPORTANT NOTES
- All text/labels should be in Brazilian Portuguese
- Status badges should always use color + text (never color alone, for accessibility)
- Number grades use comma as decimal separator in display (7,5) but period in inputs (7.5)
- Dates in Brazilian format: DD/MM/YYYY
- The system is institutional, not casual — no playful illustrations, keep it professional
- Dark mode is NOT required
```
