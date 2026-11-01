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

export const getBackendUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://ordo-z65h.onrender.com';
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  }
  return 'http://localhost:5000';
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://ordo-z65h.onrender.com/api/v1';
  }
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    const clean = envUrl.replace(/\/$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }
  return 'http://localhost:5000/api/v1';
};

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

class ApiClient {
  private inMemoryCsrfToken: string | null = null;
  private inMemoryAuthToken: string | null = null;

  setCsrfToken(token: string) {
    this.inMemoryCsrfToken = token;
  }

  setAuthToken(token: string | null) {
    this.inMemoryAuthToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        try { localStorage.setItem('ordo_token', token); } catch {}
      } else {
        try { localStorage.removeItem('ordo_token'); } catch {}
      }
    }
  }

  getAuthToken(): string | null {
    if (this.inMemoryAuthToken) return this.inMemoryAuthToken;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ordo_token');
        if (stored) {
          this.inMemoryAuthToken = stored;
          return stored;
        }
      } catch {}
    }
    return null;
  }

  private getCsrfHeader(): Record<string, string> {
    const csrfToken = this.inMemoryCsrfToken || getCookie('ordo_csrf_token');
    return csrfToken ? { 'X-CSRF-Token': csrfToken } : {};
  }

  async fetchCsrfToken(): Promise<string | null> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/csrf`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const token = json?.data?.csrfToken || json?.csrfToken;
        if (token) {
          this.inMemoryCsrfToken = token;
          return token;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !this.inMemoryCsrfToken && !getCookie('ordo_csrf_token')) {
      await this.fetchCsrfToken();
    }

    const token = this.getAuthToken();
    const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

    const url = `${getApiBaseUrl()}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getCsrfHeader(),
      ...authHeaders,
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Supports both cookies and Bearer tokens
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.error?.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data.data !== undefined ? data.data : data;
  }

  // Auth
  async register(body: any) {
    const res = await this.request<{ user: User; tokens?: { accessToken: string; refreshToken: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (res?.tokens?.accessToken) {
      this.setAuthToken(res.tokens.accessToken);
    }
    return res;
  }

  async login(body: any) {
    const res = await this.request<{ user: User; tokens?: { accessToken: string; refreshToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (res?.tokens?.accessToken) {
      this.setAuthToken(res.tokens.accessToken);
    }
    return res;
  }

  async googleLogin(body: any) {
    const res = await this.request<{ user: User; tokens?: { accessToken: string; refreshToken: string } }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (res?.tokens?.accessToken) {
      this.setAuthToken(res.tokens.accessToken);
    }
    return res;
  }

  async demoLogin() {
    const res = await this.request<{ user: User; tokens?: { accessToken: string; refreshToken: string } }>('/auth/demo', {
      method: 'POST',
      body: JSON.stringify({})
    });
    if (res?.tokens?.accessToken) {
      this.setAuthToken(res.tokens.accessToken);
    }
    return res;
  }

  async logout() {
    this.setAuthToken(null);
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

  async verifyEmail(token: string) {
    return this.request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  async changePassword(body: any) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async listSessions() {
    return this.request<any[]>('/auth/sessions');
  }

  async revokeAllSessions() {
    return this.request<{ message: string }>('/auth/sessions/revoke-all', { method: 'POST' });
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

  async exportUserData(password?: string) {
    return this.request<any>('/users/me/export', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  }

  async deleteAccount(password?: string) {
    return this.request<any>('/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ password })
    });
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
