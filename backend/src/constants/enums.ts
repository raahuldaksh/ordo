export enum TaskType {
  FIXED = 'FIXED',
  FLEXIBLE = 'FLEXIBLE',
  UNPLANNED = 'UNPLANNED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  HALF = 'HALF'
}

export enum ReasonCategory {
  DISTRACTION = 'DISTRACTION',
  LOW_ENERGY = 'LOW_ENERGY',
  POOR_PLANNING = 'POOR_PLANNING',
  PROCRASTINATION = 'PROCRASTINATION',
  UNEXPECTED_WORK = 'UNEXPECTED_WORK',
  TIME_MISMANAGEMENT = 'TIME_MISMANAGEMENT',
  HEALTH_ISSUE = 'HEALTH_ISSUE',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  INSUFFICIENT_TIME = 'INSUFFICIENT_TIME',
  OTHER = 'OTHER'
}

export enum RoutineTemplateType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY'
}

export enum ConflictStrategy {
  APPEND = 'APPEND',
  SKIP = 'SKIP',
  REPLACE_CONFIRMED = 'REPLACE_CONFIRMED'
}

export enum ReminderType {
  TASK_START = 'TASK_START',
  TASK_DEADLINE = 'TASK_DEADLINE',
  MEETING = 'MEETING',
  PENDING_TASK = 'PENDING_TASK',
  DAILY_PLANNING = 'DAILY_PLANNING',
  DAILY_REVIEW = 'DAILY_REVIEW',
  CUSTOM = 'CUSTOM'
}

export enum ReminderChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL'
}

export enum ReminderStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum CalendarProvider {
  GOOGLE = 'GOOGLE'
}

export enum CalendarSyncMode {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  TWO_WAY = 'TWO_WAY'
}

export enum CalendarEventSource {
  ORDO = 'ORDO',
  GOOGLE = 'GOOGLE'
}

