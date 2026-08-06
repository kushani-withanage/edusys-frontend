import { api } from '@/utils/api';

export interface CourseAccessGrantData {
  id?: string;
  courseId: string;
  courseName: string;
  batchCode: string;
  userIdentifier: string; // email
  grantedAt?: string;
  status?: string;
}

export const courseAccessService = {
  async getGrants(email?: string) {
    const url = email ? `/api/v1/course-access-grants?email=${encodeURIComponent(email)}` : '/api/v1/course-access-grants';
    return api.get<CourseAccessGrantData[]>(url);
  },

  async grantAccess(grant: CourseAccessGrantData) {
    return api.post<CourseAccessGrantData>('/api/v1/course-access-grants', grant);
  },

  async revokeAccess(id: string) {
    return api.delete<void>(`/api/v1/course-access-grants/${id}`);
  }
};

export default courseAccessService;
