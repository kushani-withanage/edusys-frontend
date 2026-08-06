import { api } from '@/utils/api';

export interface CourseData {
  courseId?: string;
  courseName: string;
  credits: number;
  durationWeeks: number;
  description: string;
  batchCode?: string;
  level?: string;
  isCompulsory?: boolean;
  certReqs?: string;
  qualifyIntro?: string;
  qualifyReqs?: string;
  sections?: string;
}

export const courseService = {
  async getCourses() {
    return api.get<any[]>('/api/v1/courses');
  },

  async getCourse(courseId: string) {
    return api.get<any>(`/api/v1/courses/${courseId}`);
  },

  async createCourse(course: CourseData) {
    return api.post<any>('/api/v1/courses', course);
  },

  async deleteCourse(courseId: string) {
    return api.delete<void>(`/api/v1/courses/${courseId}`);
  }
};

export default courseService;
