export type TaskType = 'FIXED' | 'FLEXIBLE' | 'UNPLANNED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'HALF';
export type RoutineTemplateType = 'DAILY' | 'WEEKLY';
export type ConflictStrategy = 'APPEND' | 'SKIP' | 'REPLACE_CONFIRMED';

export type ReasonCategory =
  | 'DISTRACTION'
  | 'LOW_ENERGY'
  | 'POOR_PLANNING'
  | 'PROCRASTINATION'
  | 'UNEXPECTED_WORK'
  | 'TIME_MISMANAGEMENT'
  | 'HEALTH_ISSUE'
  | 'TECHNICAL_ISSUE'
  | 'INSUFFICIENT_TIME'
  | 'OTHER';

export interface User {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  googleId?: string | null;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  createdAt?: string;
}

export interface UserPreferences {
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  locale: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: number;
  defaultTaskDurationMinutes: number;
  wakeTimeLocal: string;
  sleepTimeLocal: string;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  notificationPreferences: {
    taskStart: boolean;
    taskDeadline: boolean;
    dailyPlanning: boolean;
    dailyReview: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

export interface Task {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  durationMinutes: number;
  dueAt?: string | null;
  timezone: string;
  recurrenceRule?: string | null;
  reasonCategory?: ReasonCategory | null;
  actualReason?: string | null;
  tags: string[];
  sourceTemplateId?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskOutcome {
  _id: string;
  userId: string;
  taskId: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  reasonCategory?: ReasonCategory | null;
  actualReason?: string | null;
  actualStartedAt?: string | null;
  actualEndedAt?: string | null;
  actualDurationMinutes?: number | null;
  note?: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface DaySchedule {
  date: string;
  metrics: {
    totalScheduled: number;
    successCount: number;
    pendingCount: number;
    failedCount: number;
    halfCount: number;
    completionRate: number;
    plannedMinutes: number;
  };
  scheduled: {
    fixed: Task[];
    flexible: Task[];
    unplanned: Task[];
  };
  allScheduled: Task[];
  unscheduled: Task[];
}

export interface RoutineTemplate {
  _id: string;
  name: string;
  templateType: 'DAILY' | 'WEEKLY';
  description?: string;
  timezone: string;
  itemsCount?: number;
  items?: RoutineTemplateItem[];
  createdAt: string;
}

export interface RoutineTemplateItem {
  _id: string;
  templateId: string;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  dayOfWeek?: number | null;
  startTimeLocal: string;
  endTimeLocal: string;
  durationMinutes: number;
  sortOrder: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  source: 'ORDO' | 'GOOGLE';
  type: string;
  priority?: string;
  status?: string;
}

export interface Reminder {
  _id: string;
  taskId?: string | null;
  reminderType: string;
  scheduledAt: string;
  channel: 'IN_APP' | 'PUSH' | 'EMAIL';
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'CANCELLED';
  title: string;
  body?: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalPlanned: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  halfCount: number;
  completionRate: number | null;
  plannedMinutes: number;
  plannedHours: number;
  trend: Array<{
    date: string;
    total: number;
    success: number;
    failed: number;
    half: number;
    pending: number;
    completionRate: number;
  }>;
  typeBreakdown: {
    fixed: number;
    flexible: number;
    unplanned: number;
  };
  weekdayBreakdown: Array<{
    dayIndex: number;
    dayName: string;
    total: number;
    successes: number;
    completionRate: number;
  }>;
}

export interface ReasonAnalytics {
  totalReasonRecorded: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
  actualReasonLogs: Array<{
    taskId: string;
    category: string;
    reason: string;
    status: string;
    date: string;
  }>;
}

export interface WeeklyReview {
  _id: string;
  weekStartDate: string;
  weekEndDate: string;
  wins: string;
  challenges: string;
  recurringReasons: string[];
  nextWeekChanges: string;
  summarySnapshot: {
    totalPlannedTasks: number;
    successCount: number;
    pendingCount: number;
    failedCount: number;
    halfCount: number;
    completionRate: number;
    topReasons: Array<{ reason: string; count: number }>;
  };
  createdAt: string;
}

export interface AiInsight {
  _id: string;
  periodStart: string;
  periodEnd: string;
  insightType: string;
  content: {
    title: string;
    summary: string;
    observations: string[];
    recommendations: string[];
    suggestedRoutineChanges?: Array<{
      action: 'ADD' | 'MODIFY' | 'REMOVE';
      title: string;
      timeSlot?: string;
      reason: string;
    }>;
  };
  sourceMetrics: {
    completionRate: number;
    failedTasksCount: number;
    dominantReason?: string;
  };
  feedback?: 'HELPFUL' | 'UNHELPFUL' | null;
  createdAt: string;
}

