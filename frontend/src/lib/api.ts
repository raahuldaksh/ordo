import {
  User,
  UserPreferences,
  Task,
  TaskOutcome,
  DaySchedule,
  RoutineTemplate,
  CalendarEvent,
  Reminder,
  NotificationItem,
  AnalyticsSummary,
  ReasonAnalytics,
  WeeklyReview,
  AiInsight,
  TaskStatus,
  ReasonCategory
} from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('ordo_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.error?.message || `Request failed with status ${res.status}`;
      const code = data?.error?.code || 'UNKNOWN_ERROR';
      throw new Error(errorMsg);
    }

    return data.data !== undefined ? data.data : data;
  }

  // Auth
  async register(body: any) {
    return this.request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async login(body: any) {
    return this.request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async googleLogin(body: any) {
    return this.request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async logout() {
    return this.request<{ message: string }>('/auth/logout', { method: 'POST' });
  }

  async getMe() {
    return this.request<{ user: User; preferences: UserPreferences }>('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string; devResetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(body: any) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async changePassword(body: any) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // User & Preferences
  async updateMe(body: any) {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async getPreferences() {
    return this.request<UserPreferences>('/users/me/preferences');
  }

  async updatePreferences(body: any) {
    return this.request<UserPreferences>('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async exportUserData() {
    return this.request<any>('/users/me/export', { method: 'POST' });
  }

  async deleteAccount() {
    return this.request<any>('/users/me', { method: 'DELETE' });
  }

  // Tasks
  async listTasks(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<Task[]>(`/tasks${query ? `?${query}` : ''}`);
  }

  async getTask(id: string) {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(body: any) {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async updateTask(id: string, body: any) {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async deleteTask(id: string) {
    return this.request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' });
  }

  async archiveTask(id: string) {
    return this.request<Task>(`/tasks/${id}/archive`, { method: 'POST' });
  }

  async duplicateTask(id: string, targetDate?: string) {
    return this.request<Task>(`/tasks/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ targetDate })
    });
  }

  async rescheduleTask(id: string, body: { scheduledStartAt: string; scheduledEndAt: string; durationMinutes?: number }) {
    return this.request<Task>(`/tasks/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async updateTaskStatus(id: string, body: {
    status: TaskStatus;
    reasonCategory?: ReasonCategory | null;
    actualReason?: string | null;
    actualDurationMinutes?: number | null;
    note?: string | null;
  }) {
    return this.request<{ task: Task; outcome: TaskOutcome }>(`/tasks/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async getTaskOutcomes(id: string) {
    return this.request<TaskOutcome[]>(`/tasks/${id}/outcomes`);
  }

  // Planner
  async getDaySchedule(date: string) {
    return this.request<DaySchedule>(`/planner/day?date=${date}`);
  }

  async checkOverlaps(startAt: string, endAt: string, excludeTaskId?: string) {
    const query = new URLSearchParams({
      startAt,
      endAt,
      ...(excludeTaskId ? { excludeTaskId } : {})
    }).toString();
    return this.request<{ hasOverlap: boolean; overlapsCount: number; conflicts: any[] }>(`/planner/overlaps?${query}`);
  }

  // Routines
  async listRoutines() {
    return this.request<RoutineTemplate[]>('/routines');
  }

  async createRoutine(body: any) {
    return this.request<RoutineTemplate>('/routines', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async getRoutine(id: string) {
    return this.request<RoutineTemplate>(`/routines/${id}`);
  }

  async updateRoutine(id: string, body: any) {
    return this.request<RoutineTemplate>(`/routines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async deleteRoutine(id: string) {
    return this.request<{ success: boolean }>(`/routines/${id}`, { method: 'DELETE' });
  }

  async duplicateRoutine(id: string) {
    return this.request<RoutineTemplate>(`/routines/${id}/duplicate`, { method: 'POST' });
  }

  async applyRoutine(id: string, body: { startDate: string; endDate: string; conflictStrategy?: string }) {
    return this.request<{ appliedCount: number; skippedCount: number; replacedCount: number; routineName: string }>(
      `/routines/${id}/apply`,
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );
  }

  async addRoutineItem(routineId: string, body: any) {
    return this.request<any>(`/routines/${routineId}/items`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async deleteRoutineItem(routineId: string, itemId: string) {
    return this.request<{ success: boolean }>(`/routines/${routineId}/items/${itemId}`, { method: 'DELETE' });
  }

  // Calendar
  async getCalendarEvents(from?: string, to?: string) {
    const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
    return this.request<CalendarEvent[]>(`/calendar/events${query ? `?${query}` : ''}`);
  }

  async getCalendarConnections() {
    return this.request<any[]>('/calendar/connections');
  }

  async connectGoogleCalendar(code?: string) {
    return this.request<any>('/calendar/google/connect', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async syncCalendar(connectionId: string) {
    return this.request<any>(`/calendar/connections/${connectionId}/sync`, { method: 'POST' });
  }

  async disconnectCalendar(connectionId: string) {
    return this.request<any>(`/calendar/connections/${connectionId}`, { method: 'DELETE' });
  }

  // Reminders & Notifications
  async listReminders() {
    return this.request<Reminder[]>('/reminders');
  }

  async createReminder(body: any) {
    return this.request<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async deleteReminder(id: string) {
    return this.request<any>(`/reminders/${id}`, { method: 'DELETE' });
  }

  async listNotifications() {
    return this.request<NotificationItem[]>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<NotificationItem>(`/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', { method: 'POST' });
  }

  // Analytics & Reviews
  async getAnalyticsSummary(from?: string, to?: string, groupBy = 'day') {
    const query = new URLSearchParams({
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      groupBy
    }).toString();
    return this.request<AnalyticsSummary>(`/analytics/summary?${query}`);
  }

  async getReasonAnalytics(from?: string, to?: string) {
    const query = new URLSearchParams({
      ...(from ? { from } : {}),
      ...(to ? { to } : {})
    }).toString();
    return this.request<ReasonAnalytics>(`/analytics/reasons?${query}`);
  }

  async listWeeklyReviews() {
    return this.request<WeeklyReview[]>('/weekly-reviews');
  }

  async createWeeklyReview(body: any) {
    return this.request<WeeklyReview>('/weekly-reviews', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // AI Insights
  async generateAiInsights(body: { periodStart?: string; periodEnd?: string; userConsent?: boolean } = {}) {
    return this.request<AiInsight>('/ai-insights/generate', {
      method: 'POST',
      body: JSON.stringify({ userConsent: true, ...body })
    });
  }

  async listAiInsights() {
    return this.request<AiInsight[]>('/ai-insights');
  }

  async sendAiFeedback(id: string, feedback: 'HELPFUL' | 'UNHELPFUL') {
    return this.request<AiInsight>(`/ai-insights/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback })
    });
  }

  async deleteAiInsight(id: string) {
    return this.request<{ success: boolean }>(`/ai-insights/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

