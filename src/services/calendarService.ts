import { api } from '@/utils/api';

export interface CalendarEventData {
  calendarId?: string;
  eventName: string;
  eventDate: string;
  description: string;
  status: string; // EXAM, HOLIDAY, CLASS
}

export const calendarService = {
  async getEvents() {
    return api.get<any[]>('/api/v1/academic-calendars');
  },

  async createEvent(event: CalendarEventData) {
    return api.post<any>('/api/v1/academic-calendars', event);
  },

  async deleteEvent(calendarId: string) {
    return api.delete<void>(`/api/v1/academic-calendars/${calendarId}`);
  }
};

export default calendarService;
