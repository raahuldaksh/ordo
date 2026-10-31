# ORDO — Complete Product Requirements Document (PRD)

**Product name:** ORDO  
**Tagline:** Your Life. In Order.  
**Document version:** 1.0 — Final Build Specification  
**Product type:** Personal routine, task, calendar, and productivity platform  
**Design direction:** Premium monochrome SaaS, inspired by the polish and clarity of shadcn/ui, Clerk, Neon, and Cal.com  
**Important implementation instruction:** Build the frontend and backend as separate applications/modules with a clearly defined API contract. Do not mix backend business logic into frontend components. Use reusable UI components from shadcn/ui and its ecosystem; do not build standard UI primitives from scratch.

---

# 1. Product Vision

ORDO is a personal operating system for managing time and improving daily execution. It helps users plan a realistic 24-hour day, manage fixed and flexible commitments, track what actually happened, understand why tasks were missed, and improve future routines using analytics and optional AI recommendations.

ORDO is not just a to-do list. Its core loop is:

**Plan → Execute → Track → Understand → Improve**

The finished product must feel complete and production-minded: polished responsive UI, reliable authentication, persistent MongoDB data, clear empty/loading/error states, useful analytics, working reminders, and a clean deployment/configuration experience.

## 1.1 Product goals

- Plan a full day using a 24-hour timeline.
- Manage fixed, flexible, and unplanned tasks.
- Create, edit, delete, duplicate, and reschedule tasks at any time.
- Record task outcomes: Success, Pending, Failed, and Half.
- Record a predefined reason category and a separate manually written actual reason.
- Create reusable daily and weekly routines.
- View tasks and events in day, week, and month calendar views.
- Understand daily, weekly, and monthly productivity patterns.
- Identify recurring reasons for missed or partially completed tasks.
- Receive task and meeting reminders.
- Connect Google Calendar.
- Offer optional AI-generated insights and improvement suggestions.
- Support both normal email/password authentication and Google sign-in.
- Keep user data private and isolated.

## 1.2 Non-goals for the first release

- Social network, public profiles, followers, or leaderboards.
- Team project management or task assignment to other people.
- Payroll, invoicing, or subscription billing.
- Automatic tracking of browser/app usage.
- Automatically marking tasks complete because their scheduled time has passed.
- Automatically moving failed tasks to another day without user approval.

---

# 2. Required Technology Stack

## 2.1 Frontend — separate application
- **Next.js** (App Router) with React and TypeScript.
- Tailwind CSS.
- **shadcn/ui** as the primary component system.
- Lucide icons.
- React Hook Form + Zod for forms and validation.
- TanStack Query for API/server state.
- Zustand only for small client-side UI state where needed.
- Recharts using shadcn chart patterns for analytics.
- dnd-kit for accessible drag-and-drop scheduling.
- date-fns for date/time utilities.
- Sonner for toast notifications.
- next-themes for Light/Dark/System theme support.

## 2.2 Backend — separate application
- Node.js + TypeScript.
- Express.js with a modular, layered architecture.
- MongoDB Atlas as the primary database.
- Mongoose for schemas, models, validation, and indexes.
- Redis + BullMQ for scheduled reminders and background jobs (with local dev fallback).
- Zod or express-validator for request validation.
- OpenAPI/Swagger for API documentation.
- Pino or Winston for structured logging.

## 2.3 Authentication
- Normal email/password registration and login.
- Google OAuth 2.0 sign-in.
- Secure server-managed sessions or short-lived access tokens plus rotating refresh tokens in HttpOnly, Secure, SameSite cookies.
- Never store long-lived authentication tokens in localStorage.
- Hash passwords using Argon2id or bcrypt.
- Add email verification and forgot/reset password flows.
- Use OAuth state and PKCE where applicable.

---

# 3. MongoDB Database Design

Collections:
1. `users`: Account identity, credentials, Google OAuth linkage.
2. `userPreferences`: Timezone, theme, time format, week start, wake/sleep, quiet hours, notifications.
3. `tasks`: Title, description, taskType (FIXED, FLEXIBLE, UNPLANNED), priority (LOW, MEDIUM, HIGH, URGENT), status (SUCCESS, PENDING, FAILED, HALF), schedule, reasonCategory, actualReason, tags.
4. `taskOutcomes`: Append-only history of status changes, reasons, actual times.
5. `routineTemplates`: Daily & Weekly routine templates.
6. `routineTemplateItems`: Tasks associated with templates.
7. `calendarConnections`: Google Calendar sync configurations.
8. `calendarEvents`: Synced Google and ORDO events.
9. `reminders`: Scheduled alerts and triggers.
10. `notifications`: In-app alert inbox.
11. `weeklyReviews`: Weekly reflections, wins, challenges, and recurring reasons.
12. `aiInsights`: Generated reflections and scheduling tips.

