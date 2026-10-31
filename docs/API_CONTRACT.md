# ORDO — API Contract Specification

**API Version:** `v1`  
**Base URL:** `/api/v1`  
**Data Format:** JSON (`Content-Type: application/json`)  
**Timestamp Format:** ISO 8601 UTC (e.g., `2026-11-01T09:00:00.000Z`)

---

## 1. Standard Response Schemas

### 1.1 Success Response
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "timestamp": "2026-11-01T09:00:00.000Z"
  }
}
```

### 1.2 Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields.",
    "details": [
      {
        "field": "scheduledEndAt",
        "message": "scheduledEndAt must be later than scheduledStartAt"
      }
    ],
    "requestId": "req-98e2193c-fa5d-4f77-9df0-c831412030ab"
  }
}
```

---

## 2. Authentication & Account (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new account with email & password | No |
| `POST` | `/auth/login` | Log in and receive HttpOnly session cookies | No |
| `POST` | `/auth/logout` | Revoke active session and clear cookies | Yes |
| `GET` | `/auth/me` | Retrieve currently authenticated user | Yes |
| `POST` | `/auth/forgot-password` | Request password reset token via email | No |
| `POST` | `/auth/reset-password` | Set new password using reset token | No |
| `POST` | `/auth/verify-email` | Verify email address using token | No |
| `POST` | `/auth/resend-verification` | Resend verification email | Yes |
| `GET` | `/auth/google` | Initiate Google OAuth 2.0 sign-in | No |
| `GET` | `/auth/google/callback` | Google OAuth callback handler | No |
| `POST` | `/auth/change-password` | Update user password | Yes |

---

## 3. User & Preferences (`/api/v1/users`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users/me` | Get full user profile |
| `PATCH` | `/users/me` | Update full name, avatar |
| `GET` | `/users/me/preferences` | Get user preferences (timezone, theme, quiet hours) |
| `PATCH` | `/users/me/preferences` | Update preferences |
| `POST` | `/users/me/export` | Export all user data as JSON |
| `DELETE` | `/users/me` | Permanently delete account and all associated data |

---

## 4. Tasks & Outcomes (`/api/v1/tasks`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks` | List tasks with filters (`date`, `from`, `to`, `status`, `taskType`, `priority`) |
| `POST` | `/tasks` | Create a new task (Fixed, Flexible, or Unplanned) |
| `GET` | `/tasks/:taskId` | Get task details |
| `PATCH` | `/tasks/:taskId` | Update task fields |
| `DELETE` | `/tasks/:taskId` | Soft or hard delete task |
| `POST` | `/tasks/:taskId/archive` | Archive task |
| `POST` | `/tasks/:taskId/duplicate` | Duplicate task to specified date |
| `POST` | `/tasks/:taskId/reschedule` | Reschedule task start and end times |
| `POST` | `/tasks/:taskId/status` | Update task outcome status (`SUCCESS`, `PENDING`, `FAILED`, `HALF`) with `reasonCategory` and `actualReason` |
| `GET` | `/tasks/:taskId/outcomes` | Get append-only outcome history for this task |

---

## 5. 24-Hour Timeline Planner (`/api/v1/planner`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/planner/day?date=YYYY-MM-DD` | Get complete 24-hour day schedule (fixed, flexible, unplanned, unscheduled) |
| `GET` | `/planner/range?from=&to=` | Get planner schedule across a date range |
| `GET` | `/planner/overlaps?startAt=&endAt=&excludeTaskId=` | Check if a planned time range overlaps with existing scheduled tasks |

---

## 6. Routines & Templates (`/api/v1/routines`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/routines` | List routine templates (Daily / Weekly) |
| `POST` | `/routines` | Create routine template |
| `GET` | `/routines/:routineId` | Get routine template with all items |
| `PATCH` | `/routines/:routineId` | Update template metadata |
| `DELETE` | `/routines/:routineId` | Delete routine template and its items |
| `POST` | `/routines/:routineId/duplicate`| Clone an existing routine |
| `POST` | `/routines/:routineId/apply` | Apply routine to a date/range (`APPEND`, `SKIP`, `REPLACE_CONFIRMED`) |
| `POST` | `/routines/:routineId/items` | Add item to routine |
| `PATCH` | `/routines/:routineId/items/:itemId` | Update routine item |
| `DELETE` | `/routines/:routineId/items/:itemId` | Remove item from routine |

---

## 7. Calendar Integration (`/api/v1/calendar`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/calendar/events?from=&to=` | Fetch unified events (ORDO tasks + external Google Calendar events) |
| `GET` | `/calendar/connections` | Check Google Calendar connection status |
| `GET` | `/calendar/google/connect` | Start Google Calendar OAuth flow |
| `GET` | `/calendar/google/callback` | Google Calendar OAuth callback |
| `POST` | `/calendar/connections/:connectionId/sync` | Trigger manual sync |
| `PATCH` | `/calendar/connections/:connectionId` | Update sync mode (`IMPORT`, `EXPORT`, `TWO_WAY`) |
| `DELETE` | `/calendar/connections/:connectionId` | Disconnect Google Calendar |

---

## 8. Reminders & Notifications (`/api/v1/reminders`, `/api/v1/notifications`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reminders` | List active reminders |
| `POST` | `/reminders` | Create reminder for task or custom time |
| `PATCH` | `/reminders/:reminderId` | Update reminder time or channel |
| `DELETE` | `/reminders/:reminderId` | Cancel/delete reminder |
| `GET` | `/notifications` | List user in-app notifications |
| `POST` | `/notifications/:id/read` | Mark a notification as read |
| `POST` | `/notifications/read-all` | Mark all notifications as read |

---

## 9. Analytics & Weekly Reviews (`/api/v1/analytics`, `/api/v1/weekly-reviews`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/summary?from=&to=&groupBy=` | Productivity completion rates, planned vs actual time, status counts |
| `GET` | `/analytics/reasons?from=&to=` | Predefined reason categories frequency and actual reason logs |
| `GET` | `/analytics/trends?from=&to=` | Day-by-day and weekday distribution metrics |
| `GET` | `/weekly-reviews` | List previous weekly reviews |
| `POST` | `/weekly-reviews` | Save a new weekly review |
| `GET` | `/weekly-reviews/:reviewId` | Get specific review details |
| `PATCH` | `/weekly-reviews/:reviewId` | Update review notes |

---

## 10. AI Productivity Assistant (`/api/v1/ai-insights`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ai-insights/generate` | Generate actionable performance summary and routine suggestions (with user consent) |
| `GET` | `/ai-insights` | List past recommendations |
| `GET` | `/ai-insights/:insightId` | Get detailed insight |
| `POST` | `/ai-insights/:insightId/feedback` | Rate insight helpfulness |
| `DELETE` | `/ai-insights/:insightId` | Dismiss insight |

